# Create Admin User - Complete Guide

## 🎯 Admin User Profile

Here's a complete profile to create an admin user:

### Admin User Details:
```json
{
  "full_name": "System Administrator",
  "email": "admin@hremsoftconsulting.com",
  "phone": "+14165551234",
  "password": "Admin@2025Secure!",
  "role": "Admin",
  "company": "HREM Soft Consulting",
  "country": "United States"
}
```

---

## 🚀 Method 1: Via API (Recommended)

### Step 1: Create Admin Role (if not exists)
```bash
curl -X POST https://api.hremsoftconsulting.com/roles/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "description": "Full system administrator with all privileges"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "Admin",
  "description": "Full system administrator with all privileges"
}
```

### Step 2: Create Admin User
```bash
curl -X POST https://api.hremsoftconsulting.com/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "System Administrator",
    "email": "admin@hremsoftconsulting.com",
    "phone": "+14165551234",
    "password": "Admin@2025Secure!",
    "role_id": 1
  }'
```

**Response:**
```json
{
  "id": 1,
  "full_name": "System Administrator",
  "email": "admin@hremsoftconsulting.com",
  "role_id": 1
}
```

### Step 3: Test Login
```bash
curl -X POST https://api.hremsoftconsulting.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hremsoftconsulting.com",
    "password": "Admin@2025Secure!"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "role": "Admin"
}
```

---

## 🚀 Method 2: Via Database (Direct)

### Connect to Database:
```bash
sudo docker exec -it healthcare_db psql -U postgres -d healthcare
```

### SQL Commands:
```sql
-- Step 1: Create Admin role (if not exists)
INSERT INTO roles (name, description) 
VALUES ('Admin', 'Full system administrator with all privileges')
ON CONFLICT (name) DO NOTHING
RETURNING id;

-- Note the role_id returned (e.g., 1)

-- Step 2: Create Admin user
INSERT INTO users (full_name, email, phone, password_hash, role_id, is_active) 
VALUES (
  'System Administrator',
  'admin@hremsoftconsulting.com',
  '+14165551234',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5jtJ3vXHZKvUy', -- Hash for: Admin@2025Secure!
  1,  -- Use the role_id from step 1
  true
)
RETURNING id, full_name, email;

-- Step 3: Verify user was created
SELECT u.id, u.full_name, u.email, r.name as role 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'admin@hremsoftconsulting.com';
```

---

## 🚀 Method 3: Via Set Password Endpoint (If User Exists)

If the admin user already exists but you need to reset the password:

```bash
curl -X POST https://api.hremsoftconsulting.com/auth/set_password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hremsoftconsulting.com",
    "new_password": "Admin@2025Secure!"
  }'
```

---

## 📋 Complete Admin User Profiles (Multiple Examples)

### Profile 1: System Admin
```json
{
  "full_name": "System Administrator",
  "email": "admin@hremsoftconsulting.com",
  "phone": "+14165551234",
  "password": "Admin@2025Secure!",
  "role_id": 1
}
```

### Profile 2: HR Manager
```json
{
  "full_name": "HR Manager",
  "email": "hr@hremsoftconsulting.com",
  "phone": "+14165551235",
  "password": "HR@2025Secure!",
  "role_id": 2
}
```

### Profile 3: Finance Manager
```json
{
  "full_name": "Finance Manager",
  "email": "finance@hremsoftconsulting.com",
  "phone": "+14165551236",
  "password": "Finance@2025Secure!",
  "role_id": 3
}
```

---

## 🔐 Password Requirements

**Strong Password Format:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@, !, #, $, etc.)

**Examples:**
- `Admin@2025Secure!`
- `Manager#2025Strong`
- `Healthcare$Admin2025`

---

## 🧪 Testing Admin User

### Test 1: Login via Web
1. Go to: `https://healthcare.hremsoftconsulting.com/login`
2. Email: `admin@hremsoftconsulting.com`
3. Password: `Admin@2025Secure!`
4. Click "Sign in"
5. Should redirect to `/dashboard`
6. Should see full admin menu

### Test 2: Login via API
```bash
curl -X POST https://api.hremsoftconsulting.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hremsoftconsulting.com",
    "password": "Admin@2025Secure!"
  }'
```

### Test 3: Access Protected Endpoint
```bash
# Get token from login response
TOKEN="your-jwt-token-here"

# Test admin access
curl -H "Authorization: Bearer $TOKEN" \
  https://api.hremsoftconsulting.com/users/
```

---

## 🗄️ Create via Python Script

Create a file `create_admin.py`:

```python
import requests
import json

BASE_URL = "https://api.hremsoftconsulting.com"

# Step 1: Create Admin role
role_response = requests.post(
    f"{BASE_URL}/roles/",
    json={
        "name": "Admin",
        "description": "Full system administrator with all privileges"
    }
)

if role_response.status_code in [200, 201]:
    role_id = role_response.json()["id"]
    print(f"✅ Admin role created with ID: {role_id}")
elif "already exists" in role_response.text.lower():
    # Get existing role
    roles = requests.get(f"{BASE_URL}/roles/").json()
    admin_role = next((r for r in roles if r["name"].lower() == "admin"), None)
    role_id = admin_role["id"] if admin_role else 1
    print(f"✅ Using existing Admin role with ID: {role_id}")
else:
    print(f"❌ Error creating role: {role_response.text}")
    exit(1)

# Step 2: Create Admin user
user_response = requests.post(
    f"{BASE_URL}/users/",
    json={
        "full_name": "System Administrator",
        "email": "admin@hremsoftconsulting.com",
        "phone": "+14165551234",
        "password": "Admin@2025Secure!",
        "role_id": role_id
    }
)

if user_response.status_code in [200, 201]:
    user = user_response.json()
    print(f"✅ Admin user created!")
    print(f"   ID: {user['id']}")
    print(f"   Name: {user['full_name']}")
    print(f"   Email: {user['email']}")
    print(f"\n🎉 You can now login with:")
    print(f"   Email: admin@hremsoftconsulting.com")
    print(f"   Password: Admin@2025Secure!")
else:
    print(f"❌ Error creating user: {user_response.text}")
    exit(1)

# Step 3: Test login
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "admin@hremsoftconsulting.com",
        "password": "Admin@2025Secure!"
    }
)

if login_response.status_code == 200:
    token_data = login_response.json()
    print(f"\n✅ Login test successful!")
    print(f"   Token: {token_data['access_token'][:50]}...")
    print(f"   Role: {token_data['role']}")
else:
    print(f"\n⚠️  Login failed: {login_response.text}")
```

Run with:
```bash
python3 create_admin.py
```

---

## 📊 Quick Copy-Paste Commands

### Create Admin Role:
```bash
curl -X POST https://api.hremsoftconsulting.com/roles/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","description":"Full administrator"}'
```

### Create Admin User (Replace role_id with actual ID):
```bash
curl -X POST https://api.hremsoftconsulting.com/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name":"System Administrator",
    "email":"admin@hremsoftconsulting.com",
    "phone":"+14165551234",
    "password":"Admin@2025Secure!",
    "role_id":1
  }'
```

### Test Login:
```bash
curl -X POST https://api.hremsoftconsulting.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@hremsoftconsulting.com",
    "password":"Admin@2025Secure!"
  }'
```

---

## ✅ Summary

**Admin Profile Ready:**
- Email: `admin@hremsoftconsulting.com`
- Password: `Admin@2025Secure!`
- Role: `Admin`
- Full Name: `System Administrator`
- Phone: `+14165551234`

**Create Using:**
- Method 1: API calls (copy-paste commands above)
- Method 2: Direct database insert
- Method 3: Python script

**After Creation:**
- Login at: `https://healthcare.hremsoftconsulting.com/login`
- Access: Full admin dashboard
- Permissions: Everything

🎉 **Ready to create your admin user!**

