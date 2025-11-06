-- Migration: Multi-Tenancy and Enhanced Payroll System
-- Date: 2025-11-06
-- Description: Adds company isolation, countries, tax rates, salary config, and enhanced payroll

-- =========================================================
-- CREATE COUNTRIES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,  -- US, CA, etc.
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- CREATE COMPANIES TABLE
-- =========================================================
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

-- =========================================================
-- CREATE TAX RATES TABLE
-- =========================================================
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

-- =========================================================
-- CREATE STAFF SALARY CONFIGURATION TABLE
-- =========================================================
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

-- =========================================================
-- CREATE COMPANY API KEYS TABLE
-- =========================================================
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

-- =========================================================
-- UPDATE USERS TABLE (Add company and country)
-- =========================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id);

-- =========================================================
-- UPDATE PAYROLL TABLE (Enhanced with tax calculations)
-- =========================================================
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

-- =========================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_country_id ON users(country_id);
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_country_id ON companies(country_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_country_id ON tax_rates(country_id);
CREATE INDEX IF NOT EXISTS idx_salary_config_staff_id ON staff_salary_config(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_config_company_id ON staff_salary_config(company_id);
CREATE INDEX IF NOT EXISTS idx_company_api_keys_company_id ON company_api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_company_api_keys_key ON company_api_keys(key);
CREATE INDEX IF NOT EXISTS idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_company_id ON payroll(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_country_id ON payroll(country_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- =========================================================
-- SEED INITIAL DATA
-- =========================================================
-- Insert countries
INSERT INTO countries (code, name, currency) VALUES 
    ('US', 'United States', 'USD'),
    ('CA', 'Canada', 'CAD')
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- MIGRATION COMPLETE
-- =========================================================
-- Remember to:
-- 1. Create companies via API
-- 2. Link users to companies
-- 3. Configure staff salaries
-- 4. Set up tax rates for specific states/provinces

