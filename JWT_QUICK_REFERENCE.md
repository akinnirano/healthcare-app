# JWT Authentication - Quick Reference

## 🔐 For Backend Developers

### Protect an Endpoint
```python
from app.routers.security import get_current_active_user
from fastapi import Depends

@router.get("/protected")
def protected_endpoint(current_user = Depends(get_current_active_user)):
    return {"message": f"Hello {current_user.full_name}"}
```

### Require Specific Role
```python
from app.routers.security import roles_required
from fastapi import Depends

@router.get("/admin-only")
def admin_endpoint(current_user = Depends(roles_required(['admin']))):
    return {"message": "Admin access"}
```

### Require Specific Privileges
```python
from app.routers.security import privileges_required
from fastapi import Depends

@router.get("/patients")
def patients_endpoint(current_user = Depends(privileges_required(['read_patients']))):
    return {"patients": [...]}
```

### Get Current User Info
```python
from app.routers.security import get_current_active_user

@router.get("/me")
def get_profile(current_user = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role_id": current_user.role_id
    }
```

---

## 🎨 For Frontend Developers

### Login
```javascript
import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

function MyComponent() {
  const { login } = useContext(AuthContext)
  
  const handleLogin = async () => {
    await login('user@example.com', 'password123')
    // Token is automatically stored and attached to requests
  }
}
```

### Logout
```javascript
const { logout } = useContext(AuthContext)

const handleLogout = () => {
  logout() // Clears token and redirects
}
```

### Get Current User
```javascript
const { user, isAuthenticated } = useContext(AuthContext)

if (isAuthenticated) {
  console.log(user.email)
  console.log(user.role)
  console.log(user.privileges)
}
```

### Make API Call (Token Auto-Attached)
```javascript
import api from '../api/axios'

// Token is automatically attached by axios interceptor
const response = await api.get('/users/')
const users = response.data
```

### Protect a Route
```javascript
import ProtectedRoute from './components/ProtectedRoute'

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// With role restriction
<Route path="/admin" element={
  <ProtectedRoute roles={['admin', 'manager']}>
    <AdminPanel />
  </ProtectedRoute>
} />

// With privilege restriction
<Route path="/patients" element={
  <ProtectedRoute privileges={['read_patients', 'write_patients']}>
    <PatientManagement />
  </ProtectedRoute>
} />
```

---

## 🧪 Testing

### Test with cURL
```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.access_token')

# 2. Use token
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN"
```

### Test with Python Script
```bash
python test_jwt_auth.py
```

### Test with Postman
1. Login: `POST /api/auth/login` → Copy `access_token`
2. Collection Auth → Type: Bearer Token → Paste token
3. All requests now authenticated

---

## 📋 Checklist

### Backend
- ✅ All protected routes use `Depends(get_current_active_user)`
- ✅ Role-based routes use `Depends(roles_required([...]))`
- ✅ Privilege-based routes use `Depends(privileges_required([...]))`
- ✅ Public routes (login, register) don't require auth

### Frontend
- ✅ Login page calls `login(email, password)`
- ✅ Protected routes wrapped in `<ProtectedRoute>`
- ✅ Logout button calls `logout()`
- ✅ API calls use `api.get/post/put/delete()`
- ✅ Token automatically attached to all requests

---

## 🐛 Common Issues

### Backend: "Could not validate credentials"
- Check `SECRET_KEY` is set in `.env`
- Verify token format: `Bearer <token>`
- Check token hasn't expired

### Frontend: "401 on all requests"
- Check localStorage has `access_token`
- Verify axios interceptor is running
- Check browser console for errors
- Try logging out and in again

### Token keeps expiring
- Check `ACCESS_TOKEN_EXPIRE_MINUTES` in backend `.env`
- Default is 1440 minutes (24 hours)

---

## 🔑 Environment Variables

### Backend `.env`
```bash
SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend `.env`
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 📖 Full Documentation

For complete details, see: `JWT_AUTHENTICATION_GUIDE.md`

