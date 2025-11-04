# JWT Authentication Verification Checklist

Use this checklist to verify that JWT authentication is working correctly in your healthcare application.

---

## 🔧 Prerequisites

- [ ] Backend is running on `http://localhost:8000`
- [ ] Frontend is running on `http://localhost:5173`
- [ ] Database is connected and has at least one user
- [ ] User has a valid password set

---

## 🧪 Backend Tests

### 1. Public Endpoints (No JWT Required)

#### Test Login Endpoint
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

**Expected Result:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "role": "admin",
  "privileges": ["read_patients"]
}
```

- [ ] Login endpoint returns 200 status
- [ ] Response contains `access_token`
- [ ] Response contains `token_type: "bearer"`
- [ ] Response contains user `role` (if applicable)
- [ ] Response contains user `privileges` (if applicable)

#### Test Invalid Credentials
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@example.com","password":"wrong"}'
```

**Expected Result:**
```json
{
  "detail": "Invalid credentials"
}
```

- [ ] Returns 401 status
- [ ] Returns error message

---

### 2. Protected Endpoints (JWT Required)

#### Test Without Token (Should Fail)
```bash
curl -X GET http://localhost:8000/api/users/
```

**Expected Result:**
```json
{
  "detail": "Not authenticated"
}
```

- [ ] Returns 401 status
- [ ] Request is rejected without token

#### Test With Invalid Token (Should Fail)
```bash
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer invalid_token_123"
```

**Expected Result:**
```json
{
  "detail": "Could not validate credentials"
}
```

- [ ] Returns 401 status
- [ ] Invalid token is rejected

#### Test With Valid Token (Should Succeed)
```bash
# First, get a valid token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  | jq -r '.access_token')

# Then use it
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role_id": 1
  }
]
```

- [ ] Returns 200 status
- [ ] Returns list of users
- [ ] Valid token grants access

---

### 3. Role-Based Endpoints

If you have role-restricted endpoints, test them:

```bash
# With admin role - should succeed
curl -X GET http://localhost:8000/api/admin-only-endpoint \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# With patient role - should fail
curl -X GET http://localhost:8000/api/admin-only-endpoint \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

- [ ] Admin role can access admin endpoints
- [ ] Non-admin role cannot access admin endpoints
- [ ] Returns 403 for insufficient privileges

---

### 4. API Documentation

- [ ] Visit `http://localhost:8000/docs`
- [ ] Swagger UI loads correctly
- [ ] Can see all endpoints
- [ ] Can authorize with JWT token in Swagger UI
- [ ] Can test endpoints through Swagger UI

---

## 💻 Frontend Tests

### 1. Login Page

- [ ] Navigate to `http://localhost:5173/login`
- [ ] Login form is displayed
- [ ] Enter valid credentials
- [ ] Click "Sign in" button
- [ ] Login succeeds
- [ ] Redirected to dashboard
- [ ] No console errors

### 2. Token Storage

After logging in, check browser DevTools:

**Application/Storage → Local Storage → http://localhost:5173**

- [ ] `access_token` key exists
- [ ] Token value is a valid JWT (three parts separated by dots)
- [ ] Token persists after page refresh

### 3. Protected Routes

#### Test Without Login
- [ ] Clear localStorage
- [ ] Navigate to `http://localhost:5173/dashboard`
- [ ] Redirected to login page

#### Test With Login
- [ ] Login successfully
- [ ] Navigate to `http://localhost:5173/dashboard`
- [ ] Dashboard loads correctly
- [ ] No redirect to login

### 4. API Requests

Open browser DevTools → Network tab:

- [ ] Make any API call (e.g., load users list)
- [ ] Click on the request
- [ ] Check "Request Headers"
- [ ] `Authorization: Bearer <token>` header is present
- [ ] Token is automatically attached to all requests

### 5. Auto-Logout on Token Expiration

**Note:** This test requires either waiting 24 hours or temporarily reducing token expiration time.

To test quickly:
1. Set `ACCESS_TOKEN_EXPIRE_MINUTES=1` in backend `.env`
2. Restart backend
3. Login
4. Wait 1 minute
5. Try to access protected resource

- [ ] User is automatically logged out when token expires
- [ ] Redirected to login page
- [ ] Token is cleared from localStorage

### 6. Logout

- [ ] Login successfully
- [ ] Click logout button
- [ ] Token is cleared from localStorage
- [ ] Redirected to login page
- [ ] Cannot access protected routes anymore

### 7. 401 Error Handling

To test (you can manually expire a token or use an invalid token):

- [ ] Login with expired/invalid token
- [ ] Try to access protected resource
- [ ] Automatically logged out
- [ ] Redirected to login page
- [ ] User-friendly error message displayed (if applicable)

---

## 🎯 Integration Tests

### Complete User Flow

1. **Initial State**
   - [ ] User is not logged in
   - [ ] Cannot access protected routes
   - [ ] Redirected to login

2. **Login**
   - [ ] Navigate to login page
   - [ ] Enter credentials
   - [ ] Submit form
   - [ ] Token received and stored
   - [ ] Redirected to dashboard

3. **Use Protected Features**
   - [ ] View users list
   - [ ] Create new patient
   - [ ] View staff list
   - [ ] Update timesheet
   - [ ] All API requests include JWT token
   - [ ] All requests succeed

4. **Navigate Between Pages**
   - [ ] Navigate to different protected routes
   - [ ] Token persists across navigation
   - [ ] No need to re-login

5. **Refresh Browser**
   - [ ] Press F5 to refresh page
   - [ ] Token persists in localStorage
   - [ ] Still logged in
   - [ ] Can access protected resources

6. **Logout**
   - [ ] Click logout button
   - [ ] Token cleared
   - [ ] Redirected to login
   - [ ] Cannot access protected routes

---

## 🔐 Security Checks

### Token Structure

Decode your token at [jwt.io](https://jwt.io):

- [ ] Header contains `alg` and `typ`
- [ ] Payload contains `sub` (user ID)
- [ ] Payload contains `exp` (expiration)
- [ ] Payload contains `role` (if applicable)
- [ ] Payload contains `privileges` (if applicable)
- [ ] Signature is valid

### Token Security

- [ ] Token is transmitted in Authorization header (not in URL)
- [ ] Token is not visible in browser history
- [ ] Token is not logged to console in production
- [ ] HTTPS is used in production (if deployed)

### Backend Security

- [ ] All protected endpoints validate token
- [ ] Invalid tokens are rejected with 401
- [ ] Expired tokens are rejected with 401
- [ ] Missing tokens are rejected with 401
- [ ] Role restrictions work correctly
- [ ] Privilege restrictions work correctly

### Frontend Security

- [ ] Token is stored securely in localStorage
- [ ] Token is cleared on logout
- [ ] Token is cleared on 401 errors
- [ ] Protected routes redirect to login
- [ ] No sensitive data in localStorage (only token)

---

## 📊 Performance Checks

- [ ] Login response time < 1 second
- [ ] Token validation adds minimal overhead to requests
- [ ] No memory leaks from token timers
- [ ] Auto-logout timer is properly cleaned up
- [ ] Axios interceptors don't cause performance issues

---

## 🐛 Error Handling Checks

### Backend Errors

Test these scenarios:
- [ ] Login with invalid email → Returns 401
- [ ] Login with invalid password → Returns 401
- [ ] Request with no token → Returns 401
- [ ] Request with invalid token → Returns 401
- [ ] Request with expired token → Returns 401
- [ ] Request with insufficient role → Returns 403
- [ ] Request with insufficient privileges → Returns 403
- [ ] All errors return proper JSON responses
- [ ] All errors include helpful error messages

### Frontend Errors

- [ ] Network errors are caught and displayed
- [ ] 401 errors trigger auto-logout
- [ ] 403 errors show permission denied message
- [ ] Login errors are displayed to user
- [ ] Loading states are shown during requests
- [ ] Timeout errors are handled gracefully

---

## 🚀 Production Readiness

Before deploying to production, verify:

### Environment Variables
- [ ] `SECRET_KEY` is set to a strong, random value
- [ ] `SECRET_KEY` is different from development
- [ ] `SECRET_KEY` is not committed to version control
- [ ] `JWT_ALGORITHM` is set (HS256 recommended)
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` is appropriate (1440 = 24 hours)
- [ ] Database URL is correct for production
- [ ] Frontend URL is correct in CORS settings

### Security
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled (recommended)
- [ ] Password requirements are enforced
- [ ] Inactive users cannot login

### Monitoring
- [ ] Authentication failures are logged
- [ ] Token expiration events are logged (optional)
- [ ] Failed login attempts are tracked
- [ ] Monitoring/alerts are set up

---

## ✅ Test Results Summary

### Backend Tests
- [ ] All backend tests pass
- [ ] No errors in backend logs

### Frontend Tests
- [ ] All frontend tests pass
- [ ] No errors in browser console
- [ ] No network errors

### Integration Tests
- [ ] Complete user flow works end-to-end
- [ ] Token lifecycle is properly managed

### Security Tests
- [ ] All security checks pass
- [ ] No vulnerabilities identified

---

## 📝 Notes

Use this space to note any issues or observations:

```
[Your notes here]
```

---

## 🎉 Completion

If all items are checked:

✅ **JWT Authentication is fully functional!**

You can now:
1. Deploy to production with confidence
2. Share the API with other developers
3. Build additional features on top of this foundation

---

## 🔍 Troubleshooting

If any tests fail, refer to:
- `JWT_AUTHENTICATION_GUIDE.md` - Comprehensive troubleshooting guide
- `JWT_QUICK_REFERENCE.md` - Quick solutions to common issues
- Browser DevTools console and network tab
- Backend server logs

---

**Last Updated:** November 4, 2025

