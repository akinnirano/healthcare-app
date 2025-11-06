# Docs-Website Registration System - Complete Guide

## 🎉 What's New

Your documentation website now has a **complete registration system** that allows anyone to create an account and get API access!

---

## ✨ Features

### 1. **Registration Page** (`/docs-website/register`)
- Beautiful dark-themed form matching the login page
- Fields:
  - Full Name
  - Email Address
  - Phone Number
  - Company Name
  - Country (US or Canada)
  - Password (min 8 characters)
  - Confirm Password
- Real-time validation
- Success animation with auto-redirect

### 2. **Automatic Setup**
When a user registers:
- ✅ Creates user with **"docs" role**
- ✅ Auto-creates or links to company
- ✅ Assigns country for tax context
- ✅ Enables multi-tenancy isolation
- ✅ Ready to login immediately

### 3. **Login Integration**
- "Register here" link added to login page
- "Already have an account? Sign in" link on register page
- Seamless navigation between login/register

---

## 🚀 Deployment to Server

### **Quick Deploy** (Recommended)

SSH to your server and run:

```bash
cd ~/healthcare-app
git pull origin main
./deploy-multi-tenancy.sh
```

This script will:
1. Pull latest code
2. Start Docker services
3. Run database migration
4. Rebuild backend with docs-website
5. Restart services
6. Verify deployment

### **Manual Deploy**

If you prefer manual steps:

```bash
# 1. Pull code
git pull origin main

# 2. Start services
sudo docker-compose up -d

# 3. Wait for database
sleep 10

# 4. Run migration
sudo docker exec -i healthcare_db psql -U postgres -d healthcare < backend/migrations/001_multi_tenancy.sql

# 5. Rebuild and restart
sudo docker-compose build --no-cache backend
sudo docker-compose up -d backend

# 6. Check logs
sudo docker-compose logs backend | tail -50
```

---

## 🧪 Testing After Deployment

### Test 1: Registration Page Loads
```bash
curl -I https://api.hremsoftconsulting.com/docs-website/register
# Should return: HTTP/1.1 200 OK
```

### Test 2: Register New User

1. **Visit:** `https://api.hremsoftconsulting.com/docs-website/register`

2. **Fill Form:**
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `+1234567890`
   - Company: `Example Healthcare Inc`
   - Country: `United States`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`

3. **Click "Create Account"**

4. **Should See:**
   - Success message with green checkmark
   - "Registration successful! You can now login."
   - Auto-redirect to login page after 2 seconds

### Test 3: Login with New Account

1. **Visit:** `https://api.hremsoftconsulting.com/docs-website/login`

2. **Enter:**
   - Email: `john@example.com`
   - Password: `SecurePass123!`

3. **Click "Sign In"**

4. **Should:**
   - Login successfully
   - Redirect to `/docs-website/getting-started`
   - See documentation
   - See email in header with user menu

### Test 4: API Key Generated

1. After login, click your email in header
2. Click "API Key"
3. Should see auto-generated API key
4. Format: `hc_XXXXXXXXXXXXX`

---

## 🔐 How It Works

### Registration Flow

```
User visits /register
    ↓
Fills registration form
    ↓
POST /api/docs/register
    ↓
Backend checks email/phone uniqueness
    ↓
Creates/gets 'docs' role
    ↓
Creates/links company
    ↓
Creates user with:
  - role_id = docs role
  - company_id = company
  - country_id = selected country
    ↓
Returns success
    ↓
Frontend shows success message
    ↓
Auto-redirects to login after 2s
    ↓
User logs in with new credentials
    ↓
API key auto-generated
    ↓
Full access to documentation!
```

### Database Changes

**New User Record:**
```sql
INSERT INTO users (
    full_name, 
    email, 
    phone, 
    password_hash, 
    role_id,      -- 'docs' role
    company_id,   -- Linked company
    country_id,   -- For tax context
    is_active
) VALUES (...);
```

**New/Linked Company:**
```sql
-- If company doesn't exist
INSERT INTO companies (
    name,
    email,
    password_hash,  -- Same as user
    country_id,
    is_active
) VALUES (...);

-- If company exists, user is linked to it
```

---

## 📊 API Endpoints

### Registration
```http
POST /api/docs/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "company_name": "Example Healthcare Inc",
  "country_id": 1
}

Response (201 Created):
{
  "id": 42,
  "full_name": "John Doe",
  "email": "john@example.com",
  "message": "Registration successful! You can now login."
}

Error (400 Bad Request):
{
  "detail": "Email already registered"
}
```

### Login (After Registration)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "role": "Docs"
}
```

---

## 🎯 Benefits

### For Your Business:
1. ✅ **Self-Service Registration** - Users can sign up themselves
2. ✅ **Automatic Company Creation** - No manual setup needed
3. ✅ **Docs Role Isolation** - Separate from staff/patient/admin
4. ✅ **Multi-Tenancy Ready** - Each company isolated
5. ✅ **API Key Auto-Generation** - Instant access after registration

### For Your Users:
1. ✅ **Easy Registration** - Simple, beautiful form
2. ✅ **Immediate Access** - Login right after registration
3. ✅ **Clear Instructions** - Step-by-step guidance
4. ✅ **API Key Ready** - Auto-generated on first login

---

## 🔒 Security Features

### Validation:
- ✅ Email uniqueness check
- ✅ Phone uniqueness check
- ✅ Password minimum 8 characters
- ✅ Password confirmation match
- ✅ Email format validation
- ✅ Required field validation

### Password Security:
- ✅ Bcrypt hashing (cost factor 12)
- ✅ No plaintext storage
- ✅ Same hash algorithm as main app

### Role Isolation:
- ✅ "Docs" role has limited privileges
- ✅ Cannot access payroll or management features
- ✅ Only documentation and API key access

---

## 🐛 Troubleshooting

### Issue: "Not Found" error on login
**Cause:** Database migration not run (company_id column missing)  
**Solution:** Run `./deploy-multi-tenancy.sh` on server

### Issue: Registration page doesn't load
**Cause:** Frontend not rebuilt  
**Solution:** 
```bash
sudo docker-compose build --no-cache backend
sudo docker-compose up -d backend
```

### Issue: "Email already registered"
**Cause:** Email exists in users table  
**Solution:** Use different email or reset existing user

### Issue: Can't login after registration
**Cause:** Backend not restarted after migration  
**Solution:**
```bash
sudo docker-compose restart backend
```

---

## 📋 Server Deployment Checklist

- [ ] SSH to server: `ssh healthcare@orderit`
- [ ] Navigate to app: `cd ~/healthcare-app`
- [ ] Pull latest code: `git pull origin main`
- [ ] Run deployment script: `./deploy-multi-tenancy.sh`
- [ ] Wait for completion (2-3 minutes)
- [ ] Test registration: Visit `/docs-website/register`
- [ ] Register test account
- [ ] Login with test account
- [ ] Verify API key generated
- [ ] Test documentation access

---

## 🎊 What Users Will See

### On First Visit:
1. Visit `https://api.hremsoftconsulting.com/docs-website/`
2. Redirected to `/docs-website/login`
3. See "Don't have an account? **Register here**" link
4. Click "Register here"

### Registration Experience:
1. Beautiful dark-themed form
2. Fill in details (name, email, company, password)
3. Click "Create Account"
4. See success message with green checkmark
5. Auto-redirect to login after 2 seconds
6. Login with new credentials
7. Access documentation immediately
8. API key auto-generated

### After Login:
1. See company name in dashboard header
2. Click email in header → "API Key"
3. Copy API key
4. Use in API requests

---

## 📚 Example Registration

### From Command Line (Testing)
```bash
curl -X POST https://api.hremsoftconsulting.com/docs/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "TestPass123!",
    "company_name": "Test Company",
    "country_id": 1
  }'
```

### Expected Response
```json
{
  "id": 42,
  "full_name": "Test User",
  "email": "test@example.com",
  "message": "Registration successful! You can now login."
}
```

---

## 🎯 Summary

### What Was Added:

**Frontend:**
- ✅ `docs-website/src/pages/DocsRegister.jsx` - Registration page
- ✅ Updated `DocsLogin.jsx` - Added registration link
- ✅ Updated `App.jsx` - Added /register route

**Backend:**
- ✅ Updated `docs_api.py` - Added `/docs/register` endpoint
- ✅ Auto-creates 'docs' role
- ✅ Auto-creates/links company
- ✅ Assigns country for tax context

**Deployment:**
- ✅ `deploy-multi-tenancy.sh` - Complete deployment script
- ✅ Handles migration, rebuild, restart
- ✅ Tests endpoints
- ✅ Verifies deployment

---

## 🔗 Quick Links

- **Login:** https://api.hremsoftconsulting.com/docs-website/login
- **Register:** https://api.hremsoftconsulting.com/docs-website/register
- **Docs:** https://api.hremsoftconsulting.com/docs-website/getting-started

---

## 🚀 Next Steps on Server

Run these commands on your server:

```bash
# Pull latest changes
cd ~/healthcare-app
git pull origin main

# Run complete deployment
./deploy-multi-tenancy.sh

# This will:
# ✓ Start Docker services
# ✓ Run database migration
# ✓ Rebuild backend with docs-website
# ✓ Restart all services
# ✓ Test endpoints
```

After deployment:
1. Visit `/docs-website/register`
2. Create a test account
3. Login
4. Verify everything works!

---

**The registration system is ready to deploy!** 🎉

All changes have been pushed to GitHub. Just run the deployment script on your server and the registration will be live!

