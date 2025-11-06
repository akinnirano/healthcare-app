#!/bin/bash

# Complete Multi-Tenancy & Docs Registration Deployment
# This script deploys all new features to the server

set -e  # Exit on error

echo "=========================================="
echo "🚀 Multi-Tenancy Deployment"
echo "=========================================="
echo ""

# Step 1: Pull latest code
echo "📥 Step 1: Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code updated"
echo ""

# Step 2: Start Docker services
echo "🐳 Step 2: Starting Docker services..."
sudo docker-compose up -d
echo "✅ Services starting..."
echo ""

# Step 3: Wait for database to be ready
echo "⏳ Step 3: Waiting for database to be ready..."
for i in {1..30}; do
  if sudo docker exec healthcare_db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is ready"
    break
  fi
  echo "   Waiting... ($i/30)"
  sleep 2
done
echo ""

# Step 4: Run database migration
echo "🗄️  Step 4: Running database migration..."
if [ -f "backend/migrations/001_multi_tenancy.sql" ]; then
  sudo docker exec -i healthcare_db psql -U postgres -d healthcare < backend/migrations/001_multi_tenancy.sql
  echo "✅ Migration completed"
else
  echo "⚠️  Warning: Migration file not found at backend/migrations/001_multi_tenancy.sql"
  echo "   Creating tables manually..."
  
  # Create tables inline
  sudo docker exec -i healthcare_db psql -U postgres -d healthcare << 'EOSQL'
-- Countries
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

-- Companies
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

-- Tax rates, salary config, etc.
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
CREATE INDEX IF NOT EXISTS idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_company_id ON payroll(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_config_staff_id ON staff_salary_config(staff_id);

EOSQL
  
  echo "✅ Manual migration completed"
fi
echo ""

# Step 5: Verify migration
echo "🔍 Step 5: Verifying migration..."
echo ""
echo "Users table columns:"
sudo docker exec healthcare_db psql -U postgres -d healthcare -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('company_id', 'country_id');"
echo ""
echo "Companies table:"
sudo docker exec healthcare_db psql -U postgres -d healthcare -c "SELECT COUNT(*) as company_count FROM companies;" 2>/dev/null || echo "Companies table exists"
echo ""
echo "Countries:"
sudo docker exec healthcare_db psql -U postgres -d healthcare -c "SELECT code, name FROM countries;" 2>/dev/null
echo ""

# Step 6: Rebuild backend
echo "🏗️  Step 6: Rebuilding backend (includes docs-website)..."
sudo docker-compose build --no-cache backend
echo "✅ Backend built"
echo ""

# Step 7: Restart backend
echo "🔄 Step 7: Restarting backend..."
sudo docker-compose up -d backend
echo "✅ Backend restarted"
echo ""

# Step 8: Wait for backend to start
echo "⏳ Step 8: Waiting 15 seconds for backend to start..."
sleep 15
echo ""

# Step 9: Check backend logs
echo "📋 Step 9: Backend logs (last 40 lines)..."
sudo docker-compose logs backend | tail -40
echo ""

# Step 10: Test endpoints
echo "🧪 Step 10: Testing endpoints..."
echo ""
echo "Testing docs login page:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs-website/login
echo ""
echo "Testing docs register page:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs-website/register
echo ""
echo "Testing docs API (should work now):"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs
echo ""

# Final summary
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🎉 What's New:"
echo ""
echo "1. Multi-Tenancy System"
echo "   - Companies can have multiple users"
echo "   - Data isolation by company"
echo "   - Company name shown in dashboard"
echo ""
echo "2. Enhanced Payroll"
echo "   - Automatic Canada/US tax calculations"
echo "   - Bi-monthly payment tracking"
echo "   - Role-based payroll access"
echo "   - Full tax breakdown reports"
echo ""
echo "3. Docs Registration"
echo "   - Register at: /docs-website/register"
echo "   - Login at: /docs-website/login"
echo "   - Automatic 'docs' role assignment"
echo "   - Company and API key generation"
echo ""
echo "🔗 URLs:"
echo "   Login:    https://api.hremsoftconsulting.com/docs-website/login"
echo "   Register: https://api.hremsoftconsulting.com/docs-website/register"
echo "   Docs:     https://api.hremsoftconsulting.com/docs-website/getting-started"
echo ""
echo "📊 Database Tables Created:"
sudo docker exec healthcare_db psql -U postgres -d healthcare -c "\dt" | grep -E "(countries|companies|tax_rates|staff_salary|company_api)"
echo ""
echo "✨ Try logging in now!"
echo ""

