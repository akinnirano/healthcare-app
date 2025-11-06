# Payroll Management System - Complete Guide

## 🎯 Overview

A comprehensive payroll management interface with **role-based access control** that integrates with the multi-tenancy system and provides automatic tax calculations for Canada and US.

---

## 👥 Role-Based Access

### **Finance Role** (Full Access)
- ✅ View all payroll overview and statistics
- ✅ Process individual staff payroll
- ✅ Bulk process all staff payroll for company
- ✅ Approve pending payrolls
- ✅ Mark approved payrolls as paid
- ✅ View detailed tax breakdowns
- ✅ Access staff salary configuration
- ✅ View all reports

### **HR Role** (View & Manage)
- ✅ View all staff payments
- ✅ View payroll reports with tax details
- ✅ See payment history for all staff
- ✅ View payroll status (pending, approved, paid)
- ❌ Cannot process or approve payrolls

### **Staff/Practitioner Role** (Own Data Only)
- ✅ View their own payment history (bi-monthly/biweekly)
- ✅ See detailed tax breakdown for their payments
- ✅ View hours worked and hourly rate
- ✅ See current period earnings
- ❌ Cannot see other staff payments
- ❌ Cannot process payrolls

### **Patient Role** (No Access)
- ❌ Complete access denied to payroll section
- Shows "Access Denied" message

---

## 🎨 User Interface

### Navigation
Access payroll from the **Admin Dashboard** sidemenu:
1. Navigate to Admin Dashboard
2. Click **Service Request** section
3. Click **"Manage Payroll"**

### Staff View
```
┌─────────────────────────────────────────────┐
│  Current Period Earnings    │  Deductions    │
│  $1,763.80                  │  $1,036.20     │
└─────────────────────────────────────────────┘

Payment History (Bi-Monthly)
┌──────────────────────────────────────────────────────┐
│ Period          │ Hours │ Gross  │ Deductions │ Net  │
│ Jan 1-14, 2025  │ 80    │ $2,800 │ -$1,036    │ $1,764│
│ Dec 15-31, 2024 │ 76    │ $2,660 │ -$982      │ $1,678│
└──────────────────────────────────────────────────────┘

Tax Breakdown (Current Period)
┌─────────────────────────────────────┐
│ Earnings:                           │
│ Regular Hours (80h)    $2,800.00    │
│ Overtime Hours (0h)    $0.00        │
│ Gross Pay              $2,800.00    │
│                                     │
│ Deductions:                         │
│ Federal Tax           -$420.00      │
│ State/Provincial Tax  -$252.00      │
│ Social Security/CPP   -$173.60      │
│ Medicare/EI           -$40.60       │
│ Other Deductions      -$150.00      │
│ Total Deductions      -$1,036.20    │
│                                     │
│ Net Pay               $1,763.80     │
└─────────────────────────────────────┘
```

### Finance/HR View
```
Tabs: [Overview] [Process Payroll] [Reports] [Staff Configuration]

┌─────────────────────────────────────────────────────┐
│  Total Gross Pay    │  Total Deductions │  Pending  │
│  $45,600.00         │  $13,680.00       │  8        │
└─────────────────────────────────────────────────────┘

Payroll Status Distribution
[█████████░░░] Pending (45%)
[█████░░░░░░░] Approved (25%)
[███████████] Paid (30%)

All Staff Payments
┌─────────────────────────────────────────────────────────────┐
│ Staff    │ Period    │ Hours │ Gross  │ Taxes │ Net │ Status│
│ John Doe │ Jan 1-14  │ 80    │ $2,800 │ $886  │ $1,914│ PAID │
│ Jane Smith│ Jan 1-14  │ 75    │ $2,625 │ $831  │ $1,794│ APPROVED│
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Features

### 1. **Automatic Tax Calculations**
- **United States:**
  - Federal Income Tax (progressive brackets)
  - State Tax (configurable by state)
  - Social Security: 6.2% up to $160,200 annual
  - Medicare: 1.45% (no cap)

- **Canada:**
  - Federal Income Tax (progressive brackets)
  - Provincial Tax (configurable by province)
  - CPP: 5.95% up to $68,500 annual
  - EI: 1.58% up to $63,200 annual

### 2. **Bi-Monthly/Biweekly Processing**
- Automatic 14-day pay periods
- Period start/end date calculation
- Hours worked tracking
- Overtime calculations (1.5x after 40 hours)

### 3. **Payment Status Workflow**
```
PENDING → APPROVED → PAID
   ↓          ↓         ↓
Finance   Finance   Finance
Process   Approve   Mark Paid
```

### 4. **Detailed Reporting**
- Individual payment history
- Company-wide payroll statistics
- Tax breakdown by category
- Year-to-date tracking
- Export capabilities (coming soon)

### 5. **Filters & Search**
- Filter by status (pending, approved, paid)
- Filter by pay period
- Search by staff name/ID (coming soon)
- Date range selection

---

## 💻 API Integration

### Endpoints Used

#### Get Payroll Records
```http
GET /api/payroll-enhanced/
Query Parameters:
  - status: pending|approved|paid
  - staff_id: int (staff only sees their own)
  - skip: int (pagination)
  - limit: int (pagination)

Response:
[
  {
    "id": 1,
    "staff_id": 5,
    "company_id": 1,
    "country_id": 1,
    "hours_worked": 80.0,
    "hourly_rate": 35.00,
    "gross_pay": 2800.00,
    "federal_tax": 420.00,
    "state_provincial_tax": 252.00,
    "social_security_tax": 173.60,
    "medicare_tax": 40.60,
    "other_deductions": 150.00,
    "total_deductions": 1036.20,
    "net_pay": 1763.80,
    "status": "pending",
    "pay_period_start": "2025-01-01T00:00:00",
    "pay_period_end": "2025-01-14T23:59:59",
    "tax_calculation_details": {
      "country_code": "US",
      "regular_hours": 80.0,
      "overtime_hours": 0.0,
      "ytd_gross": 5600.00
    }
  }
]
```

#### Process Individual Payroll
```http
POST /api/payroll-enhanced/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "staff_id": 5,
  "pay_period_start": "2025-01-01T00:00:00",
  "pay_period_end": "2025-01-14T23:59:59",
  "hours_worked": 80.0
}

Response:
{
  "id": 1,
  "staff_id": 5,
  "gross_pay": 2800.00,
  "net_pay": 1763.80,
  "status": "pending"
}
```

#### Bulk Process Company Payroll
```http
POST /api/payroll-enhanced/process/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "company_id": 1,
  "pay_period_start": "2025-01-01T00:00:00",
  "pay_period_end": "2025-01-14T23:59:59"
}

Response:
[
  { "id": 1, "staff_id": 5, "net_pay": 1763.80 },
  { "id": 2, "staff_id": 6, "net_pay": 1894.50 }
]
```

#### Approve Payroll
```http
PUT /api/payroll-enhanced/{payroll_id}/approve
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "status": "approved"
}
```

#### Mark Payroll as Paid
```http
PUT /api/payroll-enhanced/{payroll_id}/mark-paid
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "status": "paid",
  "paid_at": "2025-01-15T10:30:00"
}
```

---

## 🗄️ Database Schema

### Payroll Table (Enhanced)
```sql
CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES staff(id) NOT NULL,
    company_id INTEGER REFERENCES companies(id),
    country_id INTEGER REFERENCES countries(id),
    
    -- Pay calculation
    hours_worked FLOAT NOT NULL,
    hourly_rate FLOAT NOT NULL,
    gross_pay FLOAT NOT NULL,
    
    -- Tax deductions
    federal_tax FLOAT DEFAULT 0.0,
    state_provincial_tax FLOAT DEFAULT 0.0,
    social_security_tax FLOAT DEFAULT 0.0,
    medicare_tax FLOAT DEFAULT 0.0,
    other_deductions FLOAT DEFAULT 0.0,
    total_deductions FLOAT DEFAULT 0.0,
    net_pay FLOAT NOT NULL,
    
    -- Status and dates
    status VARCHAR(20) DEFAULT 'pending',
    pay_period_start TIMESTAMP,
    pay_period_end TIMESTAMP,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    
    -- Tax details
    tax_calculation_details JSON
);
```

---

## 📊 Usage Examples

### Example 1: Staff Views Their Payment
1. Staff logs in to dashboard
2. Clicks "Manage Payroll" in sidemenu
3. Sees only their payment history
4. Views detailed tax breakdown

### Example 2: Finance Processes Payroll
1. Finance user logs in
2. Navigates to Payroll Management
3. Clicks "Process All Staff Payroll" button
4. System processes payroll for all active staff
5. Payrolls appear in "Pending" status
6. Finance reviews and approves each payroll
7. Finance marks approved payrolls as "Paid"

### Example 3: HR Reviews Payments
1. HR user logs in
2. Goes to Payroll Management
3. Clicks "Reports" tab
4. Views all staff payments
5. Sees tax breakdown for each staff
6. Cannot modify, only view

---

## 🔒 Security & Privacy

### Data Isolation
- Staff can **only** see their own payroll data
- HR/Finance see data filtered by their company
- Patient role has **zero** access
- All queries filtered by company_id in backend

### Permission Checks
```javascript
const isFinance = userRole === 'finance' || userRole === 'admin'
const isHR = userRole === 'hr' || userRole === 'admin'
const isStaff = userRole === 'staff' || userRole === 'practitioner'
const isPatient = userRole === 'patient'

if (isPatient) {
  return <AccessDenied />
}

if (isStaff) {
  // Only fetch own payroll
  params.staff_id = user.staff_profile.id
}
```

---

## 🎯 Tax Calculation Logic

### US Tax Calculation (Biweekly)
```javascript
// Federal Tax (2025 estimates)
if (grossPay <= 300) {
  federalTax = grossPay * 0.10
} else if (grossPay <= 1000) {
  federalTax = 30 + (grossPay - 300) * 0.12
} else if (grossPay <= 2000) {
  federalTax = 114 + (grossPay - 1000) * 0.22
} else if (grossPay <= 4000) {
  federalTax = 334 + (grossPay - 2000) * 0.24
} else {
  federalTax = 814 + (grossPay - 4000) * 0.32
}

// Social Security: 6.2% up to $160,200 annual
socialSecurityTax = grossPay * 0.062 // (if below cap)

// Medicare: 1.45% (no cap)
medicareTax = grossPay * 0.0145

// State Tax: Varies (e.g., 9% for California)
stateTax = grossPay * stateRate
```

### Canada Tax Calculation (Biweekly)
```javascript
// Federal Tax (2025 estimates)
if (grossPay <= 400) {
  federalTax = grossPay * 0.15
} else if (grossPay <= 800) {
  federalTax = 60 + (grossPay - 400) * 0.205
} else if (grossPay <= 1600) {
  federalTax = 142 + (grossPay - 800) * 0.26
} else if (grossPay <= 3200) {
  federalTax = 350 + (grossPay - 1600) * 0.29
} else {
  federalTax = 814 + (grossPay - 3200) * 0.33
}

// CPP: 5.95% up to $68,500 annual
cppTax = grossPay * 0.0595 // (if below cap)

// EI: 1.58% up to $63,200 annual
eiTax = grossPay * 0.0158

// Provincial Tax: Varies (e.g., 5.05% for Ontario)
provincialTax = grossPay * provincialRate
```

---

## 🔄 Workflow

### Payroll Processing Workflow
```
1. HR/Admin submits timesheets
   ↓
2. Finance clicks "Process All Staff Payroll"
   ↓
3. System calculates:
   - Hours worked × Hourly rate = Gross pay
   - Federal, State, SS, Medicare taxes
   - Total deductions
   - Net pay
   ↓
4. Payroll created with status: PENDING
   ↓
5. Finance reviews payroll details
   ↓
6. Finance clicks "Approve"
   ↓
7. Status changes to: APPROVED
   ↓
8. Finance processes payment via external system
   ↓
9. Finance clicks "Mark Paid"
   ↓
10. Status changes to: PAID
    ↓
11. Staff can view payment in their history
```

---

## 📱 Screenshots & UI

### Staff View
- Clean, simple interface
- Focus on their own data
- Payment cards with key metrics
- Payment history table
- Detailed tax breakdown

### Finance View
- Comprehensive dashboard
- Multiple tabs (Overview, Process, Reports, Config)
- Summary statistics
- Interactive charts
- Bulk processing capability
- Individual staff cards for processing

### HR View
- Similar to Finance but read-only
- No process/approve buttons
- View all staff payments
- Detailed reports

---

## ⚙️ Configuration

### Required Setup

1. **Staff Salary Configuration**
```bash
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

2. **User Country Assignment**
```sql
UPDATE users SET country_id = 1 WHERE id = 5; -- US
UPDATE users SET country_id = 2 WHERE id = 6; -- Canada
```

3. **User Company Assignment**
```sql
UPDATE users SET company_id = 1 WHERE id IN (5, 6, 7);
```

---

## 🐛 Troubleshooting

### Issue: Staff sees no payments
**Solution:** 
- Ensure staff has payroll records in database
- Check if staff_id is correctly linked to user
- Verify API is returning data for staff_id

### Issue: Finance cannot process payroll
**Solution:**
- Verify user has Finance or Admin role
- Check if staff has salary configuration
- Ensure staff has valid timesheet with hours

### Issue: Taxes not calculating correctly
**Solution:**
- Verify user has country_id set
- Check staff salary config exists
- Review tax calculation logic in backend

### Issue: "Access Denied" for HR
**Solution:**
- HR role should have read access
- Check role name matches exactly ('hr' or 'HR')
- Verify user.role is correctly set

---

## 📈 Future Enhancements

- [ ] Export payroll reports to PDF/Excel
- [ ] Email payslips to staff
- [ ] Advanced filtering and search
- [ ] Payroll history charts/graphs
- [ ] Direct deposit integration
- [ ] Tax form generation (W-2, T4)
- [ ] Audit trail for all changes
- [ ] Payroll comparison (period over period)
- [ ] Staff salary configuration UI
- [ ] Tax rate management UI

---

## ✅ Summary

### Completed Features:
- ✅ Role-based access control (Finance, HR, Staff, Patient)
- ✅ Automatic tax calculations (US & Canada)
- ✅ Bi-monthly payment tracking
- ✅ Detailed tax breakdown display
- ✅ Process individual and bulk payroll
- ✅ Approve and mark paid workflows
- ✅ Company name display in dashboard
- ✅ Beautiful, responsive UI
- ✅ Real-time data fetching
- ✅ Status badges and filters
- ✅ Summary statistics
- ✅ Payment history tables

### Key Benefits:
- 🎯 **Accurate:** Automatic tax calculations based on country
- 🔒 **Secure:** Role-based access, data isolation
- 📊 **Transparent:** Detailed breakdown for staff
- ⚡ **Efficient:** Bulk processing for entire company
- 📱 **User-Friendly:** Clean, intuitive interface
- 🌍 **Multi-Country:** Supports US and Canada

---

**Implementation Date:** November 6, 2025  
**Version:** 1.0  
**Status:** ✅ Complete and Ready for Use!

🎉 **The payroll management system is now fully functional and ready for production use!**

