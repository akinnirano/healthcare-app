# Documentation Website Authentication - Complete Implementation

## 🎉 Overview

The documentation website now has **complete authentication protection** with API key management. Users must log in with their Healthcare application credentials to access the documentation.

---

## ✨ Features Implemented

### 1. **Separate Login Interface**
- Beautiful dark-themed login page at `/docs-website/login`
- Matches the style of the main application but is independent
- Uses the same authentication backend

### 2. **API Key Management**
- Each authenticated user gets a unique API key
- API keys are automatically generated on first login
- Users can regenerate keys if compromised
- Keys are displayed with show/hide functionality
- Copy to clipboard with visual feedback

### 3. **Protected Routes**
- All documentation pages require authentication
- Automatic redirect to login if not authenticated
- Session persistence using localStorage
- Auto-logout on token expiration

### 4. **User Profile Menu**
- Header shows logged-in user email
- Dropdown menu with:
  - API Key Management
  - Sign Out option
- Role display in user menu

---

## 🏗️ Architecture

### Frontend (docs-website/)

```
docs-website/
├── src/
│   ├── pages/
│   │   ├── DocsLogin.jsx           # Login page (separate from main app)
│   │   ├── ApiKeyManagement.jsx    # API key display & management
│   │   └── DocPage.jsx              # Protected documentation pages
│   ├── context/
│   │   └── DocsAuthContext.jsx     # Authentication state management
│   ├── components/
│   │   ├── ProtectedRoute.jsx      # Route wrapper for auth
│   │   └── Header.jsx               # Updated with user menu
│   └── App.jsx                      # Updated with login & protected routes
```

### Backend (backend/)

```
backend/app/
├── routers/
│   └── docs_api.py                  # API key endpoints
├── db/
│   └── models.py                    # DocsApiKey model added
└── main.py                          # Docs API router included
```

---

## 🔐 Authentication Flow

### 1. User Visits Documentation
```
https://api.hremsoftconsulting.com/docs-website/getting-started
```

### 2. Not Authenticated → Redirect to Login
```
→ Redirect to /docs-website/login
```

### 3. User Logs In
```
- Enter Healthcare application email & password
- POST /api/auth/login
- Receive JWT token
- Store in localStorage as 'docs_access_token'
```

### 4. Auto-Generate API Key
```
- GET /api/docs/api-key
- If no key exists, creates one automatically
- Returns API key (format: hc_XXXXXXXXXXXXX)
- Store in localStorage as 'docs_api_key'
```

### 5. Access Documentation
```
- Redirect to /docs-website/getting-started
- All routes protected by ProtectedRoute component
- Header shows user info & logout button
```

---

## 📡 API Endpoints

### Authentication (Reuses existing)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "role": "Admin"
}
```

### Get/Create API Key
```http
GET /api/docs/api-key
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "api_key": "hc_XXXXXXXXXXXXXXXXXXXXX",
  "created_at": "2025-11-05T18:00:00",
  "last_used": null
}
```

### Regenerate API Key
```http
POST /api/docs/api-key/regenerate
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "api_key": "hc_YYYYYYYYYYYYYYYYYYYYYYY",
  "created_at": "2025-11-05T18:30:00",
  "last_used": null
}
```

### Revoke API Key
```http
DELETE /api/docs/api-key
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "detail": "API key revoked successfully"
}
```

---

## 🗄️ Database Schema

### New Table: `docs_api_keys`

```sql
CREATE TABLE docs_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_docs_api_keys_user_id ON docs_api_keys(user_id);
CREATE INDEX idx_docs_api_keys_key ON docs_api_keys(key);
```

---

## 🎨 UI Components

### 1. Login Page (`/login`)
- Gradient background with decorative elements
- Centered card layout
- Email & password inputs
- Loading state with spinner
- Error messages with icons
- Info text about using Healthcare credentials

### 2. API Key Management Page (`/api-key`)
- Account information card
- API key display with show/hide toggle
- Masked key display (hc_XXXXXXXX•••••••XXXXXXXX)
- Copy to clipboard button
- Regenerate button with confirmation
- Usage instructions (cURL, JavaScript examples)
- Security warnings

### 3. Header User Menu
- User email display
- Role badge
- Dropdown menu:
  - API Key (🔑) - Links to /api-key page
  - Sign Out (🚪) - Logs out and redirects to login

---

## 🔒 Security Features

### 1. **Token Storage**
- JWT stored in localStorage (separate from main app)
- Tokens expire after configured duration
- Auto-logout on token expiration

### 2. **API Key Format**
- Prefix: `hc_` (Healthcare)
- Length: 45 characters total
- URL-safe base64 encoding
- Unique per user

### 3. **Protected Routes**
- All doc pages require valid JWT
- ProtectedRoute component wraps all routes
- Automatic redirect to login on unauthorized access

### 4. **Separate Authentication**
- Docs authentication independent from main app
- Different localStorage keys:
  - Main app: `access_token`
  - Docs: `docs_access_token`, `docs_api_key`

---

## 🚀 Deployment Steps

### 1. Update Backend Database
```bash
# SSH to server
ssh user@your-server

# Run database migration or manually create table
docker exec -it healthcare_db psql -U postgres -d healthcare

CREATE TABLE docs_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_docs_api_keys_user_id ON docs_api_keys(user_id);
CREATE INDEX idx_docs_api_keys_key ON docs_api_keys(key);
```

### 2. Deploy Code
```bash
# Pull latest changes
cd /path/to/healthcare-app
git pull origin main

# Rebuild backend (includes docs-website build)
docker-compose build --no-cache backend

# Restart services
docker-compose up -d backend

# Check logs
docker-compose logs backend | tail -50
```

### 3. Verify Deployment
```bash
# Test login page loads
curl -I https://api.hremsoftconsulting.com/docs-website/login

# Test protected page redirects to login
curl -I https://api.hremsoftconsulting.com/docs-website/getting-started
```

---

## 🧪 Testing Guide

### Test 1: Login Flow
1. Visit: `https://api.hremsoftconsulting.com/docs-website/getting-started`
2. Should redirect to: `/docs-website/login`
3. Enter valid Healthcare credentials
4. Click "Sign In"
5. Should redirect to: `/docs-website/getting-started`
6. Documentation page loads successfully

### Test 2: API Key Generation
1. After logging in, click user menu in header
2. Click "API Key"
3. Should see API key displayed
4. Click "Show" - key should be fully visible
5. Click "Copy Key" - should copy to clipboard
6. Click "Hide" - key should be masked again

### Test 3: API Key Regeneration
1. On API Key page, click "Regenerate"
2. Confirm the dialog
3. New API key should be displayed
4. Old key is automatically revoked

### Test 4: Logout
1. Click user menu in header
2. Click "Sign Out"
3. Should redirect to `/docs-website/login`
4. Try accessing `/docs-website/getting-started` directly
5. Should redirect back to login

### Test 5: Session Persistence
1. Log in successfully
2. Close browser tab
3. Open new tab and visit any doc page
4. Should still be logged in (session persists)
5. Wait for token expiration
6. Refresh page - should redirect to login

---

## 📋 User Guide

### For End Users

#### How to Access Documentation

1. **Visit the Documentation**
   ```
   https://api.hremsoftconsulting.com/docs-website/
   ```

2. **Log In**
   - Use your Healthcare application email and password
   - Same credentials as the main application

3. **Get Your API Key**
   - After login, click your email in the header
   - Select "API Key" from dropdown
   - Your API key is automatically generated

4. **Use the Documentation**
   - Browse all documentation pages
   - Copy code examples
   - Use your API key for API requests

#### How to Use Your API Key

**In cURL:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.hremsoftconsulting.com/users/
```

**In JavaScript:**
```javascript
fetch('https://api.hremsoftconsulting.com/users/', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
```

**In Python:**
```python
import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}
response = requests.get('https://api.hremsoftconsulting.com/users/', headers=headers)
```

---

## 🎯 What Happens After Login

### Immediate Effects:
1. ✅ JWT token stored in localStorage
2. ✅ API key auto-generated and stored
3. ✅ User info displayed in header
4. ✅ Access to all documentation pages
5. ✅ Can copy and use API key

### Session Management:
- Session persists across browser tabs
- Auto-logout after token expires
- Manual logout via user menu
- Separate from main application session

---

## 🔍 Troubleshooting

### Issue: Login page doesn't load
**Solution:**
```bash
docker-compose logs backend | grep "docs-website"
# Check if docs-website is mounted correctly
```

### Issue: Login succeeds but redirects to blank page
**Solution:**
- Check browser console for JavaScript errors
- Verify BrowserRouter basename is set correctly
- Check that DocsAuthProvider is wrapping App

### Issue: API key endpoint returns 404
**Solution:**
```bash
# Check if docs_api router is included
docker-compose logs backend | grep "docs"

# Verify table exists
docker exec -it healthcare_db psql -U postgres -d healthcare
\dt docs_api_keys
```

### Issue: "Invalid credentials" on login
**Solution:**
- Verify user exists in main application
- Check email/password are correct
- Test same credentials on main app login

---

## 📊 Benefits

### For Users:
- ✅ Single sign-on (use existing Healthcare credentials)
- ✅ Secure API key management
- ✅ Easy key regeneration if compromised
- ✅ Clear usage instructions

### For Administrators:
- ✅ Complete access control
- ✅ Track who has access to documentation
- ✅ Ability to revoke access per user
- ✅ Audit trail of API key usage

### For Security:
- ✅ No anonymous access to documentation
- ✅ JWT-based authentication
- ✅ API keys tied to user accounts
- ✅ Separate session from main application

---

## 🎊 Summary

The documentation website now has:

1. ✅ **Complete Authentication** - Login required for all pages
2. ✅ **Separate Login UI** - Independent from main app
3. ✅ **API Key Management** - Auto-generation, display, regeneration
4. ✅ **User Profile** - Email, role, logout
5. ✅ **Protected Routes** - All docs behind auth
6. ✅ **Session Persistence** - Login persists across sessions
7. ✅ **Security** - JWT tokens, unique API keys
8. ✅ **User Experience** - Beautiful UI, clear instructions

**The documentation is now fully protected and ready for deployment!** 🚀

