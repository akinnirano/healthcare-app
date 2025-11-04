# JWT Authentication Guide - Healthcare App

## Overview

This healthcare application now uses **JWT (JSON Web Token)** authentication for all API requests. This guide explains how the authentication system works and how to use it.

## Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with `python-jose` for JWT handling
- **Password Hashing**: bcrypt via `passlib`
- **Token Expiration**: 24 hours (1440 minutes) by default
- **Protected Routes**: All API endpoints except `/auth/*` require valid JWT

### Frontend (React)
- **HTTP Client**: Axios with automatic token attachment
- **State Management**: React Context API (`AuthProvider`)
- **Storage**: localStorage for token persistence
- **Auto-logout**: Automatic logout on token expiration or 401 errors

---

## How It Works

### 1. Login Flow

```
User enters credentials → POST /api/auth/login → Server validates credentials
→ Server returns JWT token → Frontend stores token → Token attached to all requests
```

### 2. Request Flow

```
Frontend makes API request → Axios interceptor attaches JWT to Authorization header
→ Backend validates JWT → Request processed → Response returned
```

### 3. Token Expiration

```
Token expires → Frontend detects expiration → Auto-logout → Redirect to login
```

---

## API Endpoints

### Public Endpoints (No JWT Required)

#### 1. Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "admin",
  "privileges": ["read_patients", "write_patients"]
}
```

#### 2. Set Password (Development Only)
```bash
POST /api/auth/set_password
Content-Type: application/json

{
  "email": "user@example.com",
  "new_password": "newpassword123"
}
```

#### 3. Verify Email
```bash
GET /api/auth/verify_email?token=YOUR_EMAIL_TOKEN
```

---

### Protected Endpoints (JWT Required)

All other endpoints require a valid JWT token in the `Authorization` header.

#### Example: List Users
```bash
GET /api/users/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response
[
  {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role_id": 1
  }
]
```

#### Example: Create Patient
```bash
POST /api/patients/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "full_name": "Jane Smith",
  "address": "123 Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "phone": "+15551234567",
  "email": "jane@example.com"
}
```

---

## Testing with cURL

### 1. Login and Get Token
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Save the access_token from response
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Use Token in Requests
```bash
# List users
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN"

# Get specific user
curl -X GET http://localhost:8000/api/users/1 \
  -H "Authorization: Bearer $TOKEN"

# Create staff member
curl -X POST http://localhost:8000/api/staff/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "license_number": "RN123456",
    "skills": ["nursing", "pediatrics"],
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

---

## Testing with Python

```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api"

# 1. Login
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "admin@example.com",
        "password": "admin123"
    }
)
data = response.json()
token = data["access_token"]

# 2. Create headers with token
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 3. Make authenticated requests
# List users
users = requests.get(f"{BASE_URL}/users/", headers=headers).json()
print(users)

# Create patient
new_patient = requests.post(
    f"{BASE_URL}/patients/",
    headers=headers,
    json={
        "full_name": "Test Patient",
        "address": "123 Test St",
        "phone": "+15551234567"
    }
).json()
print(new_patient)
```

---

## Testing with Postman

### 1. Login
1. Create a `POST` request to `http://localhost:8000/api/auth/login`
2. Set Headers: `Content-Type: application/json`
3. Set Body (raw JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "admin123"
   }
   ```
4. Send request and copy the `access_token` from response

### 2. Set Authorization for Collection
1. Go to your Postman collection settings
2. Select "Authorization" tab
3. Type: `Bearer Token`
4. Token: Paste your `access_token`
5. All requests in collection will now use this token

### 3. Or Set Per Request
For individual requests:
1. Go to Authorization tab
2. Type: `Bearer Token`
3. Token: `{{access_token}}` (if using environment variable)

---

## Frontend Usage (React)

### 1. Login Component
```javascript
import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

function LoginComponent() {
  const { login } = useContext(AuthContext)
  
  async function handleSubmit(email, password) {
    try {
      await login(email, password)
      // User is now authenticated, token is stored
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error)
    }
  }
}
```

### 2. Making API Calls
```javascript
import api from '../api/axios'

// Token is automatically attached by axios interceptor
async function fetchUsers() {
  try {
    const response = await api.get('/users/')
    return response.data
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired or invalid - user will be auto-logged out
      console.log('Authentication failed')
    }
    throw error
  }
}

async function createPatient(patientData) {
  try {
    const response = await api.post('/patients/', patientData)
    return response.data
  } catch (error) {
    console.error('Failed to create patient:', error)
    throw error
  }
}
```

### 3. Protected Routes
```javascript
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Role-based protection */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin', 'manager']}>
          <AdminPanel />
        </ProtectedRoute>
      } />
      
      {/* Privilege-based protection */}
      <Route path="/patients" element={
        <ProtectedRoute privileges={['read_patients']}>
          <PatientsList />
        </ProtectedRoute>
      } />
    </Routes>
  )
}
```

### 4. Logout
```javascript
import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

function LogoutButton() {
  const { logout } = useContext(AuthContext)
  
  return (
    <button onClick={logout}>
      Logout
    </button>
  )
}
```

---

## Environment Variables

### Backend (.env)
```bash
# JWT Configuration
SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_URL=postgresql://user:password@localhost/healthcare_db

# Email Configuration
FRONTEND_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:8000
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Security Features

### Backend
✅ JWT tokens with expiration (24 hours)
✅ Secure password hashing with bcrypt
✅ Role-based access control (RBAC)
✅ Privilege-based access control
✅ Automatic token validation on all protected routes
✅ Proper HTTP status codes (401, 403)
✅ WWW-Authenticate headers for proper OAuth2 compliance

### Frontend
✅ Automatic token attachment to all requests
✅ Token stored in localStorage (persists across sessions)
✅ Automatic logout on token expiration
✅ Auto-logout on 401 errors
✅ Token validation before each use
✅ Protected routes with role/privilege checks
✅ Loading states during authentication

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```
**Cause**: Invalid, expired, or missing JWT token
**Solution**: Login again to get a new token

### 403 Forbidden
```json
{
  "detail": "Insufficient privileges. Required roles: admin, manager"
}
```
**Cause**: User doesn't have required role or privileges
**Solution**: Contact admin to get proper permissions

### 400 Bad Request
```json
{
  "detail": "Inactive user"
}
```
**Cause**: User account is inactive
**Solution**: Contact admin to activate account

---

## JWT Token Structure

A JWT token consists of three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3MzA4MDAwMDB9.signature
```

### Decoded Payload Example:
```json
{
  "sub": "123",           // User ID
  "role": "admin",        // User role
  "privileges": [         // User privileges
    "read_patients",
    "write_patients"
  ],
  "exp": 1730800000      // Expiration timestamp
}
```

You can decode tokens at [jwt.io](https://jwt.io) for debugging.

---

## Troubleshooting

### Issue: "401 Unauthorized" on all requests
**Solution**: 
1. Check if token is being attached to requests (check browser DevTools Network tab)
2. Verify token hasn't expired
3. Clear localStorage and login again

### Issue: "Token has expired"
**Solution**: 
- The app should auto-logout and redirect to login. Simply login again.

### Issue: "CORS error"
**Solution**: 
- Ensure backend CORS middleware allows your frontend origin
- Check `main.py` `allow_origins` configuration

### Issue: Frontend not attaching token
**Solution**:
1. Check localStorage has `access_token` key
2. Verify axios interceptor is properly configured
3. Check browser console for errors

---

## Best Practices

1. **Never expose SECRET_KEY**: Keep it secret and change it in production
2. **Use HTTPS in production**: JWT tokens should only be transmitted over HTTPS
3. **Short token expiration**: Balance security vs user experience
4. **Implement token refresh**: Consider adding refresh token mechanism for long sessions
5. **Validate on every request**: Backend validates token on each protected endpoint
6. **Clear tokens on logout**: Always clear localStorage on logout
7. **Handle expired tokens gracefully**: Auto-logout and redirect to login

---

## Testing Checklist

- [ ] User can login and receive JWT token
- [ ] Token is stored in localStorage
- [ ] Token is automatically attached to API requests
- [ ] Protected routes redirect to login when not authenticated
- [ ] User can access protected resources with valid token
- [ ] User is logged out when token expires
- [ ] User is logged out on 401 errors
- [ ] Role-based routes work correctly
- [ ] Privilege-based routes work correctly
- [ ] Logout clears token and redirects to login

---

## Additional Resources

- [JWT.io](https://jwt.io) - JWT debugger
- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
- [OAuth2 with Password (and hashing), Bearer with JWT tokens](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)

---

## Support

For issues or questions about JWT authentication:
1. Check this guide first
2. Review the code in `backend/app/routers/security.py`
3. Review the code in `frontend/src/api/axios.js`
4. Check browser console and network tab for errors
5. Check backend logs for JWT validation errors

