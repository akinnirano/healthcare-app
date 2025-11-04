# Healthcare Staffing & Management Platform

A comprehensive healthcare management platform for managing staff, patients, appointments, timesheets, payroll, and more.

## 🏗️ Architecture

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis
- **API Documentation**: Auto-generated OpenAPI/Swagger

### Frontend
- **Framework**: React with Vite
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **State Management**: React Context API

### Infrastructure
- **Container**: Docker & Docker Compose
- **Cloud**: AWS EKS (Kubernetes)
- **IaC**: Terraform
- **Web Server**: Nginx

---

## 🔐 Authentication

This application uses **JWT (JSON Web Token)** authentication. All API endpoints (except `/auth/*`) require a valid JWT token in the `Authorization` header.

### Quick Start
```bash
# 1. Login to get token
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "your_password"
}

# 2. Use token in subsequent requests
GET /api/users/
Headers: Authorization: Bearer <your_token>
```

### Documentation
- **Full Guide**: [JWT_AUTHENTICATION_GUIDE.md](JWT_AUTHENTICATION_GUIDE.md)
- **Quick Reference**: [JWT_QUICK_REFERENCE.md](JWT_QUICK_REFERENCE.md)
- **Test Script**: `python test_jwt_auth.py`

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Backend Setup

1. **Create virtual environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Run database migrations**
```bash
alembic upgrade head
```

5. **Start server**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start development server**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📁 Project Structure

```
healthcare-app/
├── backend/
│   ├── app/
│   │   ├── db/              # Database models and CRUD
│   │   ├── routers/         # API endpoints
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── security.py  # JWT security utilities
│   │   │   ├── users.py     # User management
│   │   │   ├── patients.py  # Patient management
│   │   │   ├── staff.py     # Staff management
│   │   │   └── ...
│   │   ├── utils/           # Utilities (email, etc.)
│   │   ├── dependencies.py  # Shared dependencies
│   │   └── main.py          # Application entry point
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API client and endpoints
│   │   │   ├── axios.js     # Axios config with JWT interceptor
│   │   │   └── endpoints.js
│   │   ├── components/      # Reusable components
│   │   │   ├── ProtectedRoute.jsx  # Route protection
│   │   │   └── ...
│   │   ├── context/         # React contexts
│   │   │   └── AuthProvider.jsx    # Auth state management
│   │   ├── pages/           # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard/
│   │   │   └── ...
│   │   ├── utils/           # Utilities
│   │   │   └── jwt.js       # JWT token handling
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── JWT_AUTHENTICATION_GUIDE.md
├── JWT_QUICK_REFERENCE.md
├── test_jwt_auth.py
└── README.md
```

---

## 🔌 API Endpoints

### Authentication (Public)
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/set_password` - Set user password (dev)
- `GET /api/auth/verify_email` - Verify email token

### Protected Endpoints (Require JWT)
All endpoints below require `Authorization: Bearer <token>` header

#### Users
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/{id}` - Get user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

#### Staff
- `GET /api/staff/` - List staff
- `POST /api/staff/` - Create staff
- `GET /api/staff/{id}` - Get staff
- `PUT /api/staff/{id}` - Update staff
- `DELETE /api/staff/{id}` - Delete staff

#### Patients
- `GET /api/patients/` - List patients
- `POST /api/patients/` - Create patient
- `GET /api/patients/{id}` - Get patient
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

#### Other Resources
- `/api/roles/` - Role management
- `/api/assignments/` - Assignment management
- `/api/shifts/` - Shift management
- `/api/timesheets/` - Timesheet management
- `/api/payroll/` - Payroll management
- `/api/visits/` - Visit management
- `/api/feedback/` - Feedback management
- `/api/compliance/` - Compliance management
- `/api/invoices/` - Invoice management

Full API documentation available at: `http://localhost:8000/docs`

---

## 🧪 Testing

### Test JWT Authentication
```bash
python test_jwt_auth.py
```

### Manual Testing with cURL
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token (replace <TOKEN> with actual token)
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <TOKEN>"
```

### Frontend Testing
```bash
cd frontend
npm run test
```

---

## 🔒 Security

### Backend Security Features
✅ JWT token authentication with expiration
✅ Password hashing with bcrypt
✅ Role-based access control (RBAC)
✅ Privilege-based access control
✅ CORS protection
✅ Input validation with Pydantic
✅ SQL injection protection via SQLAlchemy ORM

### Frontend Security Features
✅ Automatic JWT token management
✅ Protected routes with authentication
✅ Auto-logout on token expiration
✅ Auto-logout on 401 errors
✅ Token validation before use
✅ Secure token storage in localStorage

### Security Best Practices
- Always use HTTPS in production
- Rotate `SECRET_KEY` regularly
- Set strong passwords for all users
- Monitor authentication logs
- Implement rate limiting for login attempts

---

## 🌍 Environment Variables

### Backend (.env)
```bash
# JWT Configuration
SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_URL=postgresql://user:password@localhost/healthcare_db

# Redis
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password

# URLs
FRONTEND_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:8000
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🚢 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### AWS EKS Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f eks/

# Check status
kubectl get pods -n healthcare
kubectl get services -n healthcare
```

### Terraform Deployment
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## 📊 Features

### Core Features
- ✅ User authentication with JWT
- ✅ Role-based access control
- ✅ Staff management
- ✅ Patient management
- ✅ Service request tracking
- ✅ Assignment management
- ✅ Shift scheduling
- ✅ Timesheet tracking
- ✅ Payroll processing
- ✅ Invoice generation
- ✅ Visit management
- ✅ Feedback system
- ✅ Compliance tracking
- ✅ Real-time map tracking
- ✅ Email notifications

### Technical Features
- ✅ RESTful API with OpenAPI docs
- ✅ JWT authentication
- ✅ Database migrations with Alembic
- ✅ Redis caching
- ✅ Docker containerization
- ✅ Kubernetes deployment
- ✅ Infrastructure as Code (Terraform)
- ✅ Responsive UI with Tailwind CSS

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary software.

---

## 📧 Support

For questions or issues:
- Email: support@hremsoftconsulting.com
- Website: https://healthcare.hremsoftconsulting.com

---

## 🙏 Acknowledgments

- FastAPI for the amazing web framework
- React team for the frontend library
- Tailwind CSS for the styling framework
- PostgreSQL for the reliable database
- All contributors and users of this platform

---

**Built with ❤️ by HREM Soft Consulting**

