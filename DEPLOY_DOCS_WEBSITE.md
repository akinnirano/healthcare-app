# 🚀 Deploy Documentation Website - Step by Step

## Current Issue

Cannot access: `https://api.hremsoftconsulting.com/docs-website/getting-started`

**Reason:** The documentation website hasn't been built and deployed to your server yet.

---

## ✅ Solution: Deploy to Server

### Step 1: SSH to Your Server

```bash
ssh user@your-server-address
```

### Step 2: Navigate to Project

```bash
cd /path/to/healthcare-app
# The actual path on your server
```

### Step 3: Pull Latest Changes from GitHub

```bash
git pull origin main
```

This will pull:
- Documentation website source code
- Backend changes to serve docs
- GPS tracking features
- All other updates

### Step 4: Rebuild Docker Containers

```bash
# Stop current containers
docker-compose down

# Rebuild (this builds the docs-website inside backend container)
docker-compose build --no-cache backend

# Start all services
docker-compose up -d
```

### Step 5: Verify Documentation is Accessible

```bash
# Check if backend container is running
docker-compose ps

# Check backend logs
docker-compose logs backend | tail -50

# Test locally on server
curl http://localhost:8009/docs-website/
```

### Step 6: Access from Browser

Visit: `https://api.hremsoftconsulting.com/docs-website/getting-started`

---

## 🔍 Troubleshooting

### Issue 1: "404 Not Found"

**Check if docs are built:**
```bash
docker exec healthcare_backend ls -la /app/docs-website/
```

**Expected output:**
```
drwxr-xr-x  dist/
```

**If `dist/` folder doesn't exist:**
The docs-website didn't build properly. Check build logs:
```bash
docker-compose build backend 2>&1 | grep -A 20 "docs-website"
```

### Issue 2: "Connection Refused"

**Check if backend is running:**
```bash
docker-compose ps
```

**Expected:**
```
healthcare_backend  running  0.0.0.0:8009->8009/tcp
```

**If not running:**
```bash
docker-compose logs backend
docker-compose up -d backend
```

### Issue 3: Nginx/Proxy Issues

**Check your nginx configuration** (if you're using nginx in front):

```nginx
server {
    server_name api.hremsoftconsulting.com;
    
    location /docs-website/ {
        proxy_pass http://localhost:8009/docs-website/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://localhost:8009;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Issue 4: Path Issues

**Try accessing different paths:**
```
https://api.hremsoftconsulting.com/docs-website
https://api.hremsoftconsulting.com/docs-website/
https://api.hremsoftconsulting.com/docs-website/index.html
```

---

## 📋 Quick Deployment Checklist

On your server, run these commands:

```bash
# 1. Pull latest code
cd /path/to/healthcare-app
git pull origin main

# 2. Rebuild containers
docker-compose build --no-cache

# 3. Start services
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs backend | tail -100

# 5. Verify docs folder exists in container
docker exec healthcare_backend ls -la /app/docs-website/

# 6. Test locally on server
curl http://localhost:8009/docs-website/

# 7. Access from browser
# Visit: https://api.hremsoftconsulting.com/docs-website/
```

---

## 🔧 Alternative: Build Locally and Copy

If Docker build is taking too long or failing on server:

### On Your Local Machine:

```bash
# Build docs-website
cd /Users/apple/Desktop/healthcare/healthcare-app/docs-website
npm install
npm run build

# This creates dist/ folder
ls -la dist/
```

### Copy to Server:

```bash
# From your local machine
rsync -avz dist/ user@server:/path/to/healthcare-app/docs-website/dist/

# Or use scp
scp -r dist/ user@server:/path/to/healthcare-app/docs-website/
```

### On Server:

```bash
# Copy dist to backend container location
docker exec healthcare_backend mkdir -p /app/docs-website
docker cp docs-website/dist healthcare_backend:/app/docs-website/

# Restart backend
docker-compose restart backend
```

---

## 🎯 FastAPI Static Files Configuration

The backend serves docs at `/docs-website/` using this code in `backend/app/main.py`:

```python
docs_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "docs-website", "dist")
if os.path.exists(docs_dist_path):
    app.mount("/docs-website", StaticFiles(directory=docs_dist_path, html=True), name="docs-website")
```

**Path in container:** `/app/docs-website/dist/`

**Mounted at:** `/docs-website/`

---

## 🐛 Debug Commands

### Check if docs are being served:

```bash
# From server
curl http://localhost:8009/docs-website/

# Check FastAPI logs
docker-compose logs -f backend

# Check if StaticFiles is mounted
docker exec healthcare_backend python -c "import os; print(os.path.exists('/app/docs-website/dist'))"
```

### Check Docker build process:

```bash
# Rebuild with verbose output
docker-compose build backend 2>&1 | tee build.log

# Check for docs-website build stage
grep -A 10 "docs-builder" build.log
```

---

## ✅ Expected Result

After successful deployment, visiting:
```
https://api.hremsoftconsulting.com/docs-website/getting-started
```

Should show:
- 🎨 Dark-themed documentation website
- 📚 "Getting Started" guide rendered beautifully
- 🧭 Sidebar with all 15 guides
- 💻 Syntax-highlighted code examples

---

## 📞 Quick Help

**Can't access docs after deployment?**

1. **Check backend logs:**
   ```bash
   docker-compose logs backend | grep -i "docs-website\|static"
   ```

2. **Verify dist folder:**
   ```bash
   docker exec healthcare_backend find /app -name "dist" -type d
   ```

3. **Test Swagger docs work:**
   ```
   https://api.hremsoftconsulting.com/docs
   ```
   If Swagger works, backend is running correctly.

4. **Check nginx config** (if applicable)

---

## 🎯 Summary

**To make docs accessible:**

1. SSH to server
2. `cd /path/to/healthcare-app`
3. `git pull origin main`
4. `docker-compose build --no-cache`
5. `docker-compose up -d`
6. Visit: `https://api.hremsoftconsulting.com/docs-website/`

**The docs-website will be built during the Docker build process and served by FastAPI!**

---

**Need more help?** Share the output of:
```bash
docker-compose logs backend | tail -100
```

