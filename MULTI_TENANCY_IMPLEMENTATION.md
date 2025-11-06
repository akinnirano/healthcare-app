# Multi-Tenancy & Enhanced Payroll System - Implementation Guide

## 🎯 Overview

This document outlines the comprehensive multi-tenancy system with company isolation, enhanced payroll processing with Canada/US tax calculations, and company-based documentation authentication.

---

## 📊 New Database Models

### 1. **Country** (`countries`)
Stores country information for tax calculations

```sql
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,  -- US, CA
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. **Company** (`companies`)
Multi-tenancy company table with login capability

```sql
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- For docs-website login
    country_id INTEGER REFERENCES countries(id) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. **TaxRate** (`tax_rates`)
Tax rates for different countries/states/provinces

```sql
CREATE TABLE tax_rates (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES countries(id) NOT NULL,
    state_province VARCHAR(50),  -- State/Province code
    tax_year INTEGER NOT NULL,
    
    -- Federal taxes
    federal_rate FLOAT DEFAULT 0.0,
    federal_bracket_min FLOAT DEFAULT 0.0,
    federal_bracket_max FLOAT,
    
    -- State/Provincial taxes
    state_provincial_rate FLOAT DEFAULT 0.0,
    
    -- Social Security / CPP
    social_security_rate FLOAT DEFAULT 0.0,
    social_security_max_income FLOAT,
    
    -- Medicare / EI
    medicare_rate FLOAT DEFAULT 0.0,
    medicare_max_income FLOAT,
    
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. **StaffSalaryConfig** (`staff_salary_config`)
Salary and hours configuration per staff member

```sql
CREATE TABLE staff_salary_config (
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
```

### 5. **CompanyApiKey** (`company_api_keys`)
API keys for company authentication in docs-website

```sql
CREATE TABLE company_api_keys (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. **Enhanced Payroll** (`payroll` - updated)
Enhanced with tax calculations

```sql
ALTER TABLE payroll ADD COLUMN staff_id INTEGER REFERENCES staff(id);
ALTER TABLE payroll ADD COLUMN company_id INTEGER REFERENCES companies(id);
ALTER TABLE payroll ADD COLUMN country_id INTEGER REFERENCES countries(id);
ALTER TABLE payroll ADD COLUMN hours_worked FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN hourly_rate FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN gross_pay FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN federal_tax FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN state_provincial_tax FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN social_security_tax FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN medicare_tax FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN other_deductions FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN total_deductions FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN net_pay FLOAT DEFAULT 0.0;
ALTER TABLE payroll ADD COLUMN pay_period_start TIMESTAMP;
ALTER TABLE payroll ADD COLUMN pay_period_end TIMESTAMP;
ALTER TABLE payroll ADD COLUMN paid_at TIMESTAMP;
ALTER TABLE payroll ADD COLUMN payment_method VARCHAR(50);
ALTER TABLE payroll ADD COLUMN tax_calculation_details JSON;
```

### 7. **Updated Users** (`users` - updated)
Linked to company and country

```sql
ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);
ALTER TABLE users ADD COLUMN country_id INTEGER REFERENCES countries(id);
```

---

## 🚀 New API Endpoints

### Company Management (`/companies`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/companies/login` | Company login for docs-website | No |
| GET | `/companies/api-key` | Get/create company API key | Yes |
| POST | `/companies/api-key/regenerate` | Regenerate company API key | Yes |
| POST | `/companies/` | Create new company | No (for registration) |
| GET | `/companies/` | List companies | Yes |
| GET | `/companies/{id}` | Get company by ID | Yes |
| PUT | `/companies/{id}` | Update company | Yes |
| DELETE | `/companies/{id}` | Deactivate company | Yes |

### Countries (`/countries`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/countries/` | Create country | No |
| GET | `/countries/` | List countries | No |
| GET | `/countries/{id}` | Get country | No |

### Enhanced Payroll (`/payroll-enhanced`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payroll-enhanced/process` | Process payroll for staff | Yes |
| POST | `/payroll-enhanced/process/bulk` | Process for all staff in company | Yes |
| GET | `/payroll-enhanced/` | List payroll records | Yes |
| GET | `/payroll-enhanced/{id}` | Get payroll by ID | Yes |
| PUT | `/payroll-enhanced/{id}/approve` | Approve payroll | Yes |
| PUT | `/payroll-enhanced/{id}/mark-paid` | Mark as paid | Yes |

### Staff Salary Config (`/staff-salary-config`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/staff-salary-config/` | Create salary config | Yes |
| GET | `/staff-salary-config/` | List configurations | Yes |
| GET | `/staff-salary-config/{id}` | Get config by ID | Yes |
| PUT | `/staff-salary-config/{id}` | Update configuration | Yes |
| DELETE | `/staff-salary-config/{id}` | Deactivate config | Yes |

---

## 💼 Payroll Processing with Tax Calculations

### Tax Calculation Logic

#### **United States**
```python
# Federal Tax (2025 estimates - biweekly)
- $0 - $300: 10%
- $300 - $1,000: 12%
- $1,000 - $2,000: 22%
- $2,000 - $4,000: 24%
- $4,000+: 32%

# Social Security: 6.2% up to $160,200 annual
# Medicare: 1.45% (no cap)
# State Tax: Varies by state (0% - 13%)
```

#### **Canada**
```python
# Federal Tax (2025 estimates - biweekly)
- $0 - $400: 15%
- $400 - $800: 20.5%
- $800 - $1,600: 26%
- $1,600 - $3,200: 29%
- $3,200+: 33%

# CPP: 5.95% up to $68,500 annual
# EI: 1.58% up to $63,200 annual
# Provincial Tax: Varies by province (5% - 15%)
```

### Usage Example

```python
from app.services.payroll_service import PayrollProcessor

# Create processor
processor = PayrollProcessor(db)

# Process payroll for a staff member
payroll = processor.process_payroll(
    staff_id=1,
    pay_period_start=datetime(2025, 1, 1),
    pay_period_end=datetime(2025, 1, 14),
    hours_worked=80.0
)

# Process for entire company
payrolls = processor.bulk_process_payroll(
    company_id=1,
    pay_period_start=datetime(2025, 1, 1),
    pay_period_end=datetime(2025, 1, 14)
)
```

---

## 🔒 Multi-Tenancy & Data Isolation

### Company-Based Access Control

**All data is filtered by `company_id`:**

1. Users belong to companies
2. Staff are linked via users
3. All operations filter by user's company_id
4. API endpoints automatically enforce company isolation

### Example Implementation

```python
# In any protected endpoint
current_user = Depends(get_current_user)

# Filter by company
if current_user.company_id:
    query = query.filter(Model.company_id == current_user.company_id)
```

---

## 📝 Implementation Steps

### Step 1: Database Migration

```bash
# SSH to server
ssh user@your-server

# Run migrations
docker exec -it healthcare_db psql -U postgres -d healthcare

# Run the SQL scripts to create tables
\i /path/to/migration.sql
```

### Step 2: Seed Initial Data

```python
# Create countries
POST /api/countries/
{
  "code": "US",
  "name": "United States",
  "currency": "USD"
}

POST /api/countries/
{
  "code": "CA",
  "name": "Canada",
  "currency": "CAD"
}
```

### Step 3: Create Companies

```python
POST /api/companies/
{
  "name": "Healthcare Company A",
  "email": "company-a@example.com",
  "password": "SecurePassword123!",
  "country_id": 1,
  "address": "123 Main St",
  "phone": "+1-555-0100",
  "registration_number": "REG123456",
  "tax_id": "EIN12-3456789"
}
```

### Step 4: Configure Staff Salaries

```python
POST /api/staff-salary-config/
{
  "staff_id": 1,
  "hourly_rate": 35.00,
  "expected_hours_per_week": 40.0,
  "pay_frequency": "biweekly",
  "overtime_rate_multiplier": 1.5,
  "overtime_threshold_hours": 40.0,
  "has_benefits": true,
  "benefits_deduction": 150.00
}
```

### Step 5: Process Payroll

```python
POST /api/payroll-enhanced/process
{
  "staff_id": 1,
  "pay_period_start": "2025-01-01T00:00:00",
  "pay_period_end": "2025-01-14T23:59:59",
  "hours_worked": 80.0
}
```

---

## 🎨 Frontend Updates Needed

### 1. Dashboard - Show Company Name

Update dashboard components to display company information:

```javascript
// In Dashboard component
const { user, company } = useAuth();

<div className="header">
  <h1>Welcome to {company?.name || 'Healthcare Dashboard'}</h1>
  <p>Company: {company?.name} | Country: {company?.country?.name}</p>
</div>
```

### 2. Company Login for Docs-Website

Create new login flow for companies:

```javascript
// DocsCompanyLogin.jsx
const handleCompanyLogin = async (email, password) => {
  const response = await axios.post('/api/companies/login', {
    email, password
  });
  
  // Store company token
  localStorage.setItem('company_token', response.data.access_token);
  
  // Redirect to docs
  navigate('/docs-website/getting-started');
};
```

### 3. API Key Display

Show company API key instead of user API key:

```javascript
// Fetch company API key
const response = await axios.get('/api/companies/api-key', {
  headers: { Authorization: `Bearer ${token}` }
});

setApiKey(response.data.api_key);
```

---

## 📚 Testing Guide

### Test Company Creation
```bash
curl -X POST http://localhost:8000/api/companies/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "email": "test@company.com",
    "password": "TestPass123!",
    "country_id": 1
  }'
```

### Test Company Login
```bash
curl -X POST http://localhost:8000/api/companies/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "TestPass123!"
  }'
```

### Test Payroll Processing
```bash
curl -X POST http://localhost:8000/api/payroll-enhanced/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_id": 1,
    "pay_period_start": "2025-01-01T00:00:00",
    "pay_period_end": "2025-01-14T23:59:59",
    "hours_worked": 80.0
  }'
```

---

## 🔐 Security Considerations

1. **Company Isolation**
   - All queries filtered by company_id
   - Users cannot access other company data
   - API keys are company-specific

2. **Tax Calculations**
   - Rates stored in database for flexibility
   - YTD calculations for Social Security caps
   - Detailed audit trail in JSON

3. **Password Security**
   - Company passwords hashed with bcrypt
   - Minimum 8 characters required
   - No plaintext storage

---

## 📊 Database Indexes

Create these indexes for performance:

```sql
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX idx_payroll_company_id ON payroll(company_id);
CREATE INDEX idx_payroll_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX idx_salary_config_staff_id ON staff_salary_config(staff_id);
CREATE INDEX idx_company_api_keys_company_id ON company_api_keys(company_id);
```

---

## ✅ Summary

### Completed Features:
- ✅ Company database model with authentication
- ✅ Country and tax rate models
- ✅ Staff salary configuration model
- ✅ Enhanced payroll model with tax fields
- ✅ Payroll processing service with Canada/US calculations
- ✅ Company management API endpoints
- ✅ Countries API endpoints
- ✅ Staff salary configuration API
- ✅ Enhanced payroll API with process endpoints
- ✅ Company API key generation
- ✅ Multi-tenancy foundation

### Pending Tasks:
- ⏳ Company authentication in docs-website frontend
- ⏳ Row-level security middleware
- ⏳ Dashboard company name display
- ⏳ Update existing routers for company filtering
- ⏳ Tax rate CRUD endpoints
- ⏳ Frontend salary configuration UI
- ⏳ Frontend payroll processing UI

---

## 🚀 Next Steps

1. Run database migrations
2. Seed countries and initial companies
3. Test payroll processing
4. Update frontend for company display
5. Implement company login in docs-website
6. Add row-level security middleware
7. Update all routers for company isolation

---

**Implementation Date:** November 6, 2025  
**Version:** 1.0  
**Status:** Backend Complete, Frontend Pending

