# Check Documentation Deployment

## Quick Diagnosis

Run these commands on your server to diagnose the issue:

### 1. Check Backend Startup Logs

```bash
docker-compose logs backend | grep -E "docs-website|Found|Mounted|⚠"
```

**Expected to see:**
```
✓ Found docs-website at: /app/docs-website/dist
✓ Mounted documentation website at /docs-website/
```

**If you see:**
```
⚠ docs-website/dist not found. Documentation will not be available.
```

Then the docs weren't built in the container.

### 2. Check if Dist Folder Exists in Container

```bash
docker exec healthcare_backend ls -la /app/docs-website/
```

**Expected:**
```
drwxr-xr-x  dist/
```

**If folder doesn't exist:**
The multi-stage Docker build didn't work.

### 3. Check All Paths in Container

```bash
docker exec healthcare_backend find /app -name "dist" -type d
```

### 4. Check Backend Container Build

```bash
docker-compose logs backend | head -100
```

---

## 🔧 Solution

The issue is that the **docs-website wasn't built during Docker build**.

### Quick Fix: Build Locally and Copy to Server

Since your backend container is already running, let's build the docs locally and copy them:

#### On Your Local Machine:

```bash
cd /Users/apple/Desktop/healthcare/healthcare-app/docs-website

# Build the documentation website
npm run build

# This creates dist/ folder with all files
ls -la dist/
```

#### Copy to Server:

```bash
# Replace with your actual server details
scp -r dist/ user@your-server:/tmp/docs-dist/

# Or use rsync
rsync -avz dist/ user@your-server:/tmp/docs-dist/
```

#### On Your Server:

```bash
# Copy into running backend container
docker cp /tmp/docs-dist/ healthcare_backend:/app/docs-website/dist/

# Restart backend to pick up changes
docker-compose restart backend

# Verify
docker exec healthcare_backend ls -la /app/docs-website/dist/
```

#### Test:

```
https://api.hremsoftconsulting.com/docs-website/getting-started
```

Should work now! ✅

---

## 🛠️ Permanent Fix: Fix Docker Build

The Dockerfile multi-stage build needs to work properly. Check if the build context is correct:

```bash
# On server, rebuild with verbose output
docker-compose build backend 2>&1 | tee build.log

# Search for docs-builder stage
grep -A 20 "docs-builder" build.log
```

### Common Issues:

**1. Build Context Wrong**

The `docker-compose.yml` should have:
```yaml
backend:
  build:
    context: .              # Root directory (not ./backend)
    dockerfile: ./backend/Dockerfile
```

**2. Files Not Found During Build**

Check if `docs-website/` folder exists on server:
```bash
ls -la docs-website/
```

Should show:
```
package.json
src/
public/
```

**3. npm ci Failing**

Check build logs for npm errors during docs-builder stage.

---

## ✅ Recommended Approach

### Immediate (Quick Fix):

1. Build docs locally on your Mac
2. Copy dist/ to server  
3. Copy into running container
4. Restart backend

**Takes 2 minutes, works immediately!**

### Long-term (Proper Fix):

1. Fix Dockerfile build context
2. Ensure docs-website files are on server
3. Rebuild properly with multi-stage build

---

## 📝 Commands Summary

```bash
# LOCAL MACHINE
cd docs-website
npm run build
scp -r dist/ user@server:/tmp/docs-dist/

# ON SERVER
docker cp /tmp/docs-dist/ healthcare_backend:/app/docs-website/dist/
docker-compose restart backend

# TEST
curl http://localhost:8009/docs-website/
# Then visit: https://api.hremsoftconsulting.com/docs-website/
```

This will get your docs live immediately while you fix the Docker build! 🚀

