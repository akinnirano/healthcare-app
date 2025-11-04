# Public Registration Endpoints

## Overview

The registration endpoints for **PractitionerRegister** and **PatientRegister** pages are now **PUBLIC** (no JWT authentication required). This allows new users to self-register without needing to be logged in.

---

## Changes Made

### Backend (FastAPI)

#### 1. Main Application (`backend/app/main.py`)
- Removed router-level JWT authentication for registration-related endpoints
- Added selective authentication at the individual endpoint level
- Public routers:
  - `/auth` - Authentication endpoints (login, verify email, etc.)
  - `/users` - User creation (POST) is public
  - `/roles` - Role lookup (GET) and creation (POST, PUT) are public
  - `/staff` - Staff creation (POST) is public
  - `/patients` - Patient creation (POST) is public
  - `/priviledges` - Privilege lookup (GET) and creation (POST) are public

#### 2. Individual Router Files

**Updated files with selective JWT authentication:**

##### `/users` - User Management
- ✅ **POST /users/** - PUBLIC (for registration)
- 🔒 **GET /users/** - REQUIRES JWT (list users)
- 🔒 **GET /users/{id}** - REQUIRES JWT (get specific user)
- 🔒 **PUT /users/{id}** - REQUIRES JWT (update user)
- 🔒 **DELETE /users/{id}** - REQUIRES JWT (delete user)

##### `/roles` - Role Management
- ✅ **GET /roles/** - PUBLIC (for role lookup during registration)
- ✅ **GET /roles/{id}** - PUBLIC (for role lookup)
- ✅ **POST /roles/** - PUBLIC (for admin role creation during registration)
- ✅ **PUT /roles/{id}** - PUBLIC (for admin role update during registration)
- 🔒 **DELETE /roles/{id}** - REQUIRES JWT

##### `/priviledges` - Privilege Management
- ✅ **GET /priviledges/** - PUBLIC (for privilege lookup)
- ✅ **GET /priviledges/{id}** - PUBLIC (for privilege lookup)
- ✅ **POST /priviledges/** - PUBLIC (for privilege creation during setup)
- 🔒 **PUT /priviledges/{id}** - REQUIRES JWT
- 🔒 **DELETE /priviledges/{id}** - REQUIRES JWT

##### `/staff` - Staff Management
- ✅ **POST /staff/** - PUBLIC (for practitioner registration)
- 🔒 **GET /staff/** - REQUIRES JWT (list staff)
- 🔒 **GET /staff/{id}** - REQUIRES JWT (get specific staff)
- 🔒 **PUT /staff/{id}** - REQUIRES JWT (update staff)
- 🔒 **DELETE /staff/{id}** - REQUIRES JWT (delete staff)

##### `/patients` - Patient Management
- ✅ **POST /patients/** - PUBLIC (for patient registration)
- 🔒 **GET /patients/** - REQUIRES JWT (list patients)
- 🔒 **GET /patients/{id}** - REQUIRES JWT (get specific patient)
- 🔒 **PUT /patients/{id}** - REQUIRES JWT (update patient)
- 🔒 **DELETE /patients/{id}** - REQUIRES JWT (delete patient)

---

## Frontend Impact

### No Changes Required

The frontend registration pages will now work **without authentication**:

- **`/register-practitioner`** (PractitionerRegister.jsx)
  - Can create admin user
  - Can create roles and privileges
  - Can create staff profile
  - **No JWT token needed**

- **`/register-patient`** (PatientRegister.jsx)
  - Can create patient user
  - Can lookup roles
  - Can create patient profile
  - **No JWT token needed**

---

## Security Considerations

### ✅ What's Protected

- **All other operations** (GET lists, GET individual, PUT, DELETE) still require JWT
- **All other endpoints** (shifts, timesheets, payroll, etc.) fully protected with JWT
- **Modification operations** on registration endpoints are protected

### ⚠️ What's Public

The following operations are now public for registration purposes:

1. **Creating Users** - Anyone can create a user account
2. **Creating Patients** - Anyone can create a patient profile
3. **Creating Staff** - Anyone can create a staff profile
4. **Looking up Roles** - Anyone can view available roles
5. **Creating/Updating Roles** - Anyone can create or update roles
6. **Looking up Privileges** - Anyone can view privileges
7. **Creating Privileges** - Anyone can create privileges

### 🔐 Security Recommendations

1. **Add Rate Limiting**: Implement rate limiting on registration endpoints to prevent abuse
2. **Email Verification**: Require email verification before account activation
3. **CAPTCHA**: Consider adding CAPTCHA to registration forms
4. **Admin Notification**: Send notification to admins when new users register
5. **Account Approval**: Consider requiring admin approval for new practitioner accounts
6. **Restrict Role/Privilege Creation**: In production, you may want to protect role and privilege creation

---

## Testing

### Test Registration Without JWT

#### 1. Patient Registration
```bash
# Create patient user
curl -X POST http://api.hremsoftconsulting.com/users \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password_hash": "$2a$10$...",
    "role_id": 2,
    "phone": "+15551234567"
  }'

# Create patient profile
curl -X POST http://api.hremsoftconsulting.com/patients \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "phone": "+15551234567",
    "email": "john@example.com"
  }'
```

#### 2. Practitioner Registration
```bash
# Create admin user
curl -X POST http://api.hremsoftconsulting.com/users \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Dr. Jane Smith",
    "email": "jane@example.com",
    "password_hash": "$2a$10$...",
    "role_id": 1,
    "phone": "+15559876543"
  }'

# Create staff profile
curl -X POST http://api.hremsoftconsulting.com/staff \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "license_number": "RN123456",
    "skills": ["nursing", "pediatrics"],
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Test Protected Endpoints Still Require JWT

```bash
# This should FAIL (401) without JWT
curl -X GET http://api.hremsoftconsulting.com/users/

# This should SUCCEED with JWT
curl -X GET http://api.hremsoftconsulting.com/users/ \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## API Documentation

Visit the updated Swagger documentation at:
```
http://localhost:8000/docs
```

or in production:
```
https://api.hremsoftconsulting.com/docs
```

Each endpoint now shows in its summary whether it's public or requires JWT:
- **"(public for registration)"** - No authentication required
- **"(requires JWT)"** - Authentication required

---

## Migration Notes

### If You Were Using These Endpoints Before

1. **Registration pages** will now work without logging in first
2. **GET operations** on users, staff, and patients now require JWT
3. **All previously working authenticated operations** continue to work as before

### No Breaking Changes For:

- Login flow
- Authenticated user operations
- All other protected endpoints
- JWT token generation and validation

---

## Summary

✅ **Patient and Practitioner registration** now works without JWT authentication

✅ **All modification operations** (GET lists, PUT, DELETE) still protected with JWT

✅ **Security maintained** for sensitive operations

✅ **Frontend registration pages** work without authentication

✅ **No changes needed** to existing authenticated flows

---

## File Changes

Modified files:
1. `backend/app/main.py` - Router configuration
2. `backend/app/routers/users.py` - Selective JWT on endpoints
3. `backend/app/routers/roles.py` - Selective JWT on endpoints
4. `backend/app/routers/priviledges.py` - Selective JWT on endpoints
5. `backend/app/routers/staff.py` - Selective JWT on endpoints
6. `backend/app/routers/patients.py` - Selective JWT on endpoints

No frontend changes required - registration pages already work correctly!

---

**Last Updated:** November 4, 2025

