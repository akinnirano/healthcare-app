# JWT Authentication Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      Healthcare Application                       │
│                                                                    │
│  ┌─────────────────────┐         ┌──────────────────────┐        │
│  │   React Frontend    │         │  FastAPI Backend     │        │
│  │                     │         │                      │        │
│  │  - Login Form       │ ◄─────► │  - JWT Generation   │        │
│  │  - AuthProvider     │         │  - Token Validation │        │
│  │  - ProtectedRoute   │         │  - User Auth        │        │
│  │  - Axios Interceptor│         │  - RBAC/PBAC        │        │
│  └─────────────────────┘         └──────────────────────┘        │
│           │                                │                       │
│           │ localStorage                   │ PostgreSQL           │
│           ▼                                ▼                       │
│  ┌─────────────────────┐         ┌──────────────────────┐        │
│  │  JWT Token Storage  │         │   User Database      │        │
│  └─────────────────────┘         └──────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### 1. Login Process

```
┌──────────┐                                              ┌──────────┐
│          │  1. POST /auth/login                         │          │
│  User    │  { email, password }                         │ Backend  │
│ Browser  │ ──────────────────────────────────────────►  │  API     │
│          │                                               │          │
│          │                                               │          │
│          │  2. Verify password with bcrypt               │          │
│          │     Get user role & privileges               │          │
│          │                                               │          │
│          │                                               │          │
│          │  3. Generate JWT token                        │          │
│          │     Sign with SECRET_KEY                      │          │
│          │     Set expiration (24h)                      │          │
│          │                                               │          │
│          │                                               │          │
│          │  4. Return token + role + privileges          │          │
│          │  ◄──────────────────────────────────────────  │          │
│          │  {                                            │          │
│          │    access_token: "eyJhbGc...",                │          │
│          │    token_type: "bearer",                      │          │
│          │    role: "admin",                             │          │
│          │    privileges: [...]                          │          │
│          │  }                                            │          │
│          │                                               │          │
│          │  5. Store token in localStorage                │          │
│          │     Store user in React state                 │          │
│          │     Schedule auto-logout at exp               │          │
│          │                                               │          │
└──────────┘                                               └──────────┘
```

### 2. API Request with JWT

```
┌──────────┐                                              ┌──────────┐
│          │  1. API Request (e.g., GET /users/)          │          │
│  React   │ ──────────────────────────────────────────►  │          │
│  App     │                                               │          │
│          │  ┌─────────────────────────┐                 │          │
│          │  │ Axios Interceptor       │                 │          │
│          │  │ - Reads token from      │                 │          │
│          │  │   localStorage          │                 │          │
│          │  │ - Adds Authorization:   │                 │          │
│          │  │   Bearer <token>        │                 │          │
│          │  └─────────────────────────┘                 │          │
│          │                                               │          │
│          │  2. Request with JWT token                    │          │
│          │  Authorization: Bearer eyJhbGc...            │          │
│          │ ──────────────────────────────────────────►  │ Backend  │
│          │                                               │  API     │
│          │  ┌─────────────────────────┐                 │          │
│          │  │ JWT Middleware          │                 │          │
│          │  │ - Extract token         │                 │          │
│          │  │ - Verify signature      │                 │          │
│          │  │ - Check expiration      │                 │          │
│          │  │ - Load user from DB     │                 │          │
│          │  │ - Check is_active       │                 │          │
│          │  │ - Verify role/privileges│                 │          │
│          │  └─────────────────────────┘                 │          │
│          │                                               │          │
│          │  3. Process request                           │          │
│          │     Execute business logic                    │          │
│          │                                               │          │
│          │                                               │          │
│          │  4. Return response                           │          │
│          │  ◄──────────────────────────────────────────  │          │
│          │  { data: [...] }                              │          │
│          │                                               │          │
└──────────┘                                               └──────────┘
```

### 3. Token Expiration / 401 Error

```
┌──────────┐                                              ┌──────────┐
│          │  1. API Request with expired token            │          │
│  React   │ ──────────────────────────────────────────►  │ Backend  │
│  App     │  Authorization: Bearer <expired_token>        │  API     │
│          │                                               │          │
│          │                                               │          │
│          │  2. Token validation fails                    │          │
│          │     - Token expired                           │          │
│          │     - OR invalid signature                    │          │
│          │                                               │          │
│          │                                               │          │
│          │  3. Return 401 Unauthorized                   │          │
│          │  ◄──────────────────────────────────────────  │          │
│          │  {                                            │          │
│          │    detail: "Token has expired"                │          │
│          │  }                                            │          │
│          │                                               │          │
│          │  ┌─────────────────────────┐                 │          │
│          │  │ Response Interceptor    │                 │          │
│          │  │ - Detect 401 error      │                 │          │
│          │  │ - Clear token           │                 │          │
│          │  │ - Clear user state      │                 │          │
│          │  │ - Redirect to login     │                 │          │
│          │  └─────────────────────────┘                 │          │
│          │                                               │          │
│          │  4. User redirected to login page             │          │
│          │                                               │          │
└──────────┘                                               └──────────┘
```

---

## Component Architecture

### Backend Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  app/routers/security.py                     │          │
│  │  ─────────────────────────────────────────   │          │
│  │                                              │          │
│  │  ▸ create_access_token()                    │          │
│  │    - Generates JWT with user info           │          │
│  │    - Sets expiration time                   │          │
│  │    - Signs with SECRET_KEY                  │          │
│  │                                              │          │
│  │  ▸ decode_access_token()                    │          │
│  │    - Validates JWT signature                │          │
│  │    - Checks expiration                      │          │
│  │    - Returns payload                        │          │
│  │                                              │          │
│  │  ▸ get_current_user()                       │          │
│  │    - Dependency injection                   │          │
│  │    - Extracts token from header             │          │
│  │    - Validates token                        │          │
│  │    - Loads user from database               │          │
│  │                                              │          │
│  │  ▸ get_current_active_user()                │          │
│  │    - Verifies user is active                │          │
│  │    - Used by most endpoints                 │          │
│  │                                              │          │
│  │  ▸ roles_required(['admin'])                │          │
│  │    - Role-based access control              │          │
│  │    - Checks user has required role          │          │
│  │                                              │          │
│  │  ▸ privileges_required(['read_patients'])   │          │
│  │    - Privilege-based access control         │          │
│  │    - Checks user has required privileges    │          │
│  │                                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  app/routers/auth.py                         │          │
│  │  ─────────────────────────────────────────   │          │
│  │                                              │          │
│  │  ▸ POST /login                              │          │
│  │    - Public endpoint                        │          │
│  │    - Validates credentials                  │          │
│  │    - Returns JWT token                      │          │
│  │                                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  app/routers/users.py (and others)           │          │
│  │  ─────────────────────────────────────────   │          │
│  │                                              │          │
│  │  ▸ All endpoints use:                       │          │
│  │    Depends(get_current_active_user)         │          │
│  │    - Requires valid JWT                     │          │
│  │    - Auto-validates on every request        │          │
│  │                                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Components

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  src/api/axios.js                            │          │
│  │  ─────────────────────────────────────────   │          │
│  │                                              │          │
│  │  ▸ Request Interceptor                      │          │
│  │    - Reads token from localStorage          │          │
│  │    - Attaches Authorization header          │          │
│  │    - Normalizes URLs                        │          │
│  │                                              │          │
│  │  ▸ Response Interceptor                     │          │
│  │    - Handles 401 errors                     │          │
│  │    - Handles 403 errors                     │          │
│  │    - Logs helpful messages                  │          │
│  │                                              │          │
│  │  ▸ login(email, password)                   │          │
│  │    - Posts to /auth/login                   │          │
│  │    - Returns token data                     │          │
│  │                                              │          │
│  │  ▸ isTokenValid()                           │          │
│  │    - Checks token expiration                │          │
│  │    - Returns boolean                        │          │
│  │                                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  src/context/AuthProvider.jsx                │          │
│  │  ─────────────────────────────────────────   │          │
│  │                                              │          │
│  │  State:                                      │          │
│  │    - user (decoded JWT payload)             │          │
│  │    - token (JWT string)                     │          │
│  │    - loading (auth check in progress)       │          │
│  │    - isAuthenticated (boolean)              │          │
│  │                                              │          │
│  │  Functions:                                  │          │
│  │    - login(email, password)                 │          │
│  │    - logout()                               │          │
│  │                                              │          │
│  │  Effects:                                    │          │
│  │    - Token validation on mount              │          │
│  │    - Auto-logout timer                      │          │
│  │    - 401 response interceptor               │          │
│  │    - localStorage sync                      │          │
│  │                                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  src/components/ProtectedRoute.jsx           │          │
│  │  ─────────────────────────────────────────   │          │
│  │                                              │          │
│  │  ▸ Checks authentication                    │          │
│  │    - Redirects to login if not auth         │          │
│  │    - Shows loading spinner                  │          │
│  │                                              │          │
│  │  ▸ Role-based protection                    │          │
│  │    - Checks user has required role          │          │
│  │    - Shows access denied if not             │          │
│  │                                              │          │
│  │  ▸ Privilege-based protection               │          │
│  │    - Checks user has required privileges    │          │
│  │    - Shows access denied if not             │          │
│  │                                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  src/utils/jwt.js                            │          │
│  │  ─────────────────────────────────────────   │          │
│  │                                              │          │
│  │  ▸ getUserFromToken(token)                  │          │
│  │    - Decodes JWT payload                    │          │
│  │    - Returns user object                    │          │
│  │    - Handles parsing errors                 │          │
│  │                                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## JWT Token Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     JWT Token Format                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9                      │
│  │                                                          │
│  └─► HEADER (Base64)                                       │
│      {                                                      │
│        "alg": "HS256",    ← Signing algorithm              │
│        "typ": "JWT"       ← Token type                     │
│      }                                                      │
│                                                             │
│  .                                                          │
│                                                             │
│  eyJzdWIiOiIxMjMiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3MzA4... │
│  │                                                          │
│  └─► PAYLOAD (Base64)                                      │
│      {                                                      │
│        "sub": "123",              ← User ID                │
│        "role": "admin",           ← User role              │
│        "privileges": [            ← User privileges        │
│          "read_patients",                                  │
│          "write_patients"                                  │
│        ],                                                   │
│        "exp": 1730800000          ← Expiration timestamp   │
│      }                                                      │
│                                                             │
│  .                                                          │
│                                                             │
│  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c              │
│  │                                                          │
│  └─► SIGNATURE                                             │
│      HMACSHA256(                                           │
│        base64(header) + "." + base64(payload),            │
│        SECRET_KEY                                          │
│      )                                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Password Security                                  │
│  ┌─────────────────────────────────────────┐                │
│  │ ▸ bcrypt hashing                        │                │
│  │ ▸ Salt per password                     │                │
│  │ ▸ Configurable complexity               │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
│  Layer 2: Token Generation                                   │
│  ┌─────────────────────────────────────────┐                │
│  │ ▸ JWT with HS256 signing                │                │
│  │ ▸ Strong SECRET_KEY                     │                │
│  │ ▸ Expiration timestamp                  │                │
│  │ ▸ User claims (ID, role, privileges)    │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
│  Layer 3: Token Validation                                   │
│  ┌─────────────────────────────────────────┐                │
│  │ ▸ Signature verification                │                │
│  │ ▸ Expiration check                      │                │
│  │ ▸ User existence check                  │                │
│  │ ▸ Active user check                     │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
│  Layer 4: Authorization                                      │
│  ┌─────────────────────────────────────────┐                │
│  │ ▸ Role-based access control (RBAC)      │                │
│  │ ▸ Privilege-based access control (PBAC) │                │
│  │ ▸ Endpoint-level protection             │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
│  Layer 5: Frontend Protection                                │
│  ┌─────────────────────────────────────────┐                │
│  │ ▸ Protected routes                      │                │
│  │ ▸ Automatic token attachment            │                │
│  │ ▸ Auto-logout on expiration             │                │
│  │ ▸ Auto-logout on 401                    │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

```
User Login
    ↓
Credentials Validated
    ↓
JWT Token Generated
    ↓
Token Sent to Frontend
    ↓
Token Stored in localStorage
    ↓
Token Attached to All API Requests
    ↓
Backend Validates Token on Each Request
    ↓
Request Processed (if valid)
    ↓
Response Returned
    ↓
[When Token Expires]
    ↓
Auto-Logout
    ↓
Redirect to Login
```

---

## File Organization

```
healthcare-app/
│
├── Backend JWT Files
│   ├── app/routers/security.py      ← JWT utilities
│   ├── app/routers/auth.py          ← Login endpoint
│   └── app/main.py                  ← Protected routes config
│
├── Frontend JWT Files
│   ├── src/api/axios.js             ← HTTP client + interceptors
│   ├── src/context/AuthProvider.jsx ← Auth state management
│   ├── src/components/ProtectedRoute.jsx ← Route protection
│   └── src/utils/jwt.js             ← Token decoding
│
└── Documentation
    ├── JWT_AUTHENTICATION_GUIDE.md  ← Comprehensive guide
    ├── JWT_QUICK_REFERENCE.md       ← Quick reference
    ├── JWT_VERIFICATION_CHECKLIST.md ← Testing checklist
    ├── JWT_ARCHITECTURE.md          ← This file
    └── test_jwt_auth.py             ← Test script
```

---

## Technology Stack

```
┌────────────────────────────────────────┐
│           Backend Stack                │
├────────────────────────────────────────┤
│ ▸ FastAPI         - Web framework      │
│ ▸ python-jose     - JWT library        │
│ ▸ passlib         - Password hashing   │
│ ▸ bcrypt          - Hash algorithm     │
│ ▸ SQLAlchemy      - ORM                │
│ ▸ PostgreSQL      - Database           │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│           Frontend Stack               │
├────────────────────────────────────────┤
│ ▸ React           - UI framework       │
│ ▸ React Router    - Routing            │
│ ▸ Axios           - HTTP client        │
│ ▸ Context API     - State management   │
│ ▸ localStorage    - Token storage      │
└────────────────────────────────────────┘
```

---

**This architecture provides secure, scalable JWT authentication for your healthcare application!**

