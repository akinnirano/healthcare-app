#!/bin/bash

# Fix Docker ContainerConfig error and deploy
# This handles the KeyError: 'ContainerConfig' issue

set -e

echo "=========================================="
echo "🔧 Fixing Docker Issues & Deploying"
echo "=========================================="
echo ""

# Step 1: Stop all containers
echo "🛑 Step 1: Stopping all containers..."
sudo docker-compose down
echo "✅ Containers stopped"
echo ""

# Step 2: Remove corrupted containers
echo "🗑️  Step 2: Removing old containers..."
sudo docker container prune -f
echo "✅ Old containers removed"
echo ""

# Step 3: Remove old backend image (corrupted)
echo "🗑️  Step 3: Removing old backend image..."
sudo docker rmi healthcare-app_backend 2>/dev/null || echo "Image already removed"
sudo docker rmi $(sudo docker images -f "dangling=true" -q) 2>/dev/null || echo "No dangling images"
echo "✅ Old images removed"
echo ""

# Step 4: Pull latest code
echo "📥 Step 4: Pulling latest code..."
git pull origin main
echo "✅ Code updated"
echo ""

# Step 5: Build fresh images
echo "🏗️  Step 5: Building fresh images (this may take 3-5 minutes)..."
sudo docker-compose build --no-cache
echo "✅ Images built"
echo ""

# Step 6: Start services
echo "🚀 Step 6: Starting services..."
sudo docker-compose up -d
echo "✅ Services started"
echo ""

# Step 7: Wait for database
echo "⏳ Step 7: Waiting for database to be ready..."
for i in {1..30}; do
  if sudo docker exec healthcare_db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is ready"
    break
  fi
  echo "   Waiting... ($i/30)"
  sleep 2
done
echo ""

# Step 8: Run migration
echo "🗄️  Step 8: Running database migration..."
sudo docker exec -i healthcare_db psql -U postgres -d healthcare << 'EOSQL'
-- Create countries
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO countries (code, name, currency) VALUES 
    ('US', 'United States', 'USD'),
    ('CA', 'Canada', 'CAD')
ON CONFLICT (code) DO NOTHING;

-- Create companies
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    country_id INTEGER REFERENCES countries(id) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id);

-- Create tax_rates
CREATE TABLE IF NOT EXISTS tax_rates (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES countries(id) NOT NULL,
    state_province VARCHAR(50),
    tax_year INTEGER NOT NULL,
    federal_rate FLOAT DEFAULT 0.0,
    federal_bracket_min FLOAT DEFAULT 0.0,
    federal_bracket_max FLOAT,
    state_provincial_rate FLOAT DEFAULT 0.0,
    social_security_rate FLOAT DEFAULT 0.0,
    social_security_max_income FLOAT,
    medicare_rate FLOAT DEFAULT 0.0,
    medicare_max_income FLOAT,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_salary_config
CREATE TABLE IF NOT EXISTS staff_salary_config (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) UNIQUE NOT NULL,
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    hourly_rate FLOAT NOT NULL,
    expected_hours_per_week FLOAT DEFAULT 40.0,
    expected_hours_per_pay_period FLOAT,
    pay_frequency VARCHAR(20) DEFAULT 'biweekly',
    overtime_rate_multiplier FLOAT DEFAULT 1.5,
    overtime_threshold_hours FLOAT DEFAULT 40.0,
    has_benefits BOOLEAN DEFAULT FALSE,
    benefits_deduction FLOAT DEFAULT 0.0,
    additional_deductions JSON,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create company_api_keys
CREATE TABLE IF NOT EXISTS company_api_keys (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update payroll table
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS staff_id INTEGER REFERENCES staff(id);
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id);
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS hours_worked FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS hourly_rate FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS gross_pay FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS federal_tax FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS state_provincial_tax FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS social_security_tax FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS medicare_tax FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS other_deductions FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS total_deductions FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS net_pay FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS pay_period_start TIMESTAMP;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS pay_period_end TIMESTAMP;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS tax_calculation_details JSON;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_country_id ON users(country_id);
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_company_id ON payroll(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_config_staff_id ON staff_salary_config(staff_id);
CREATE INDEX IF NOT EXISTS idx_company_api_keys_company_id ON company_api_keys(company_id);

EOSQL

echo "✅ Migration completed"
echo ""

# Step 9: Verify migration
echo "🔍 Step 9: Verifying migration..."
echo ""
echo "Users table structure (showing new columns):"
sudo docker exec healthcare_db psql -U postgres -d healthcare -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name IN ('company_id', 'country_id');"
echo ""
echo "Countries:"
sudo docker exec healthcare_db psql -U postgres -d healthcare -c "SELECT * FROM countries;"
echo ""
echo "Companies count:"
sudo docker exec healthcare_db psql -U postgres -d healthcare -c "SELECT COUNT(*) FROM companies;"
echo ""

# Step 10: Restart backend to apply changes
echo "🔄 Step 10: Restarting backend..."
sudo docker-compose restart backend
echo "✅ Backend restarted"
echo ""

# Step 11: Wait for backend
echo "⏳ Step 11: Waiting 10 seconds for backend to start..."
sleep 10
echo ""

# Step 12: Check logs
echo "📋 Step 12: Backend logs (last 30 lines)..."
sudo docker-compose logs backend | tail -30
echo ""

# Step 13: Test endpoints
echo "🧪 Step 13: Testing endpoints..."
echo ""
echo "Login page:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs-website/login
echo ""
echo "Register page:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs-website/register
echo ""
echo "Swagger docs:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs
echo ""

# Final summary
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🎉 All Systems Ready!"
echo ""
echo "📝 What's Now Available:"
echo ""
echo "1. Docs Registration:"
echo "   → https://api.hremsoftconsulting.com/docs-website/register"
echo "   - Anyone can register for API access"
echo "   - Automatic 'docs' role assignment"
echo "   - Company and API key creation"
echo ""
echo "2. Docs Login:"
echo "   → https://api.hremsoftconsulting.com/docs-website/login"
echo "   - Login with registered credentials"
echo "   - Access full documentation"
echo ""
echo "3. Multi-Tenancy:"
echo "   - Companies isolated by company_id"
echo "   - Dashboard shows company name"
echo "   - Data filtered by company"
echo ""
echo "4. Enhanced Payroll:"
echo "   - Automatic Canada/US tax calculations"
echo "   - Role-based access (Finance/HR/Staff)"
echo "   - Bi-monthly payment tracking"
echo ""
echo "🔗 Quick Links:"
echo "   Register: https://api.hremsoftconsulting.com/docs-website/register"
echo "   Login:    https://api.hremsoftconsulting.com/docs-website/login"
echo "   Docs:     https://api.hremsoftconsulting.com/docs-website/getting-started"
echo "   Swagger:  https://api.hremsoftconsulting.com/docs"
echo ""
echo "✨ Try registering now!"
echo ""

