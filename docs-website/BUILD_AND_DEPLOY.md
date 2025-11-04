# Documentation Website - Build & Deploy Guide

## Overview

The documentation website is served at `https://api.hremsoftconsulting.com/docs-website/`

It's built into the backend Docker container and served as static files by FastAPI.

---

## Local Development

### Start Development Server

```bash
cd docs-website
npm run dev
```

Visit: `http://localhost:3001/docs-website/`

### Build for Production

```bash
cd docs-website
npm run build
```

This creates a `dist/` folder with the production build.

---

## Docker Deployment

### How It Works

1. The backend `Dockerfile` has a multi-stage build:
   - **Stage 1**: Builds the docs-website (Node.js)
   - **Stage 2**: Copies the built files to the Python backend

2. FastAPI serves the static files at `/docs-website/`

3. When you visit `api.hremsoftconsulting.com/docs-website/`, FastAPI serves the documentation.

### Build and Deploy

```bash
# Build all containers (includes docs website)
docker-compose build

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

### Verify Deployment

Visit: `https://api.hremsoftconsulting.com/docs-website/`

---

## Project Structure

```
docs-website/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top teal navigation bar
│   │   ├── Sidebar.jsx         # Left navigation (Getting Started, Auth, etc.)
│   │   ├── MainContent.jsx     # Main documentation content
│   │   └── OnThisPage.jsx      # Right sidebar (On This Page)
│   ├── styles/
│   │   └── index.css           # Tailwind CSS
│   ├── App.jsx
│   └── main.jsx
├── Dockerfile                   # (Not used - built in backend Dockerfile)
├── nginx.conf                   # (Not used - served by FastAPI)
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Customization

### Update Content

Edit `src/components/MainContent.jsx` to change the documentation content.

### Update Navigation

Edit `src/components/Sidebar.jsx` to modify the left navigation menu.

### Update Styles

Edit `tailwind.config.js` to change colors, spacing, etc.

Current theme colors:
- `dark-bg`: #0f172a (main background)
- `dark-sidebar`: #1e293b (sidebar background)  
- `dark-content`: #111827 (content background)
- `teal-accent`: #14b8a6 (header, links)

---

## Integration with FastAPI

The documentation is served by FastAPI using `StaticFiles`:

```python
# backend/app/main.py
from fastapi.staticfiles import StaticFiles

docs_dist_path = os.path.join(os.path.dirname(...), "docs-website", "dist")
if os.path.exists(docs_dist_path):
    app.mount("/docs-website", StaticFiles(directory=docs_dist_path, html=True), name="docs-website")
```

This means:
- ✅ Served at `/docs-website/` path
- ✅ Same domain as API (no CORS issues)
- ✅ Built once during Docker build
- ✅ Served efficiently by FastAPI

---

## After Making Changes

1. **Update content** in `src/components/MainContent.jsx`
2. **Rebuild Docker container**:
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```
3. **Visit** `https://api.hremsoftconsulting.com/docs-website/`

---

## Git Workflow

```bash
# Add changes (source files only, not node_modules)
git add docs-website/src/
git add docs-website/*.js
git add docs-website/*.json
git add docs-website/index.html

# Commit
git commit -m "Update documentation website"

# Push
git push origin main
```

**Note:** `node_modules/` and `dist/` are gitignored and not committed.

---

## Troubleshooting

### Documentation not showing

1. Check if dist folder exists in container:
   ```bash
   docker exec healthcare_backend ls -la /app/docs-website/
   ```

2. Check FastAPI logs:
   ```bash
   docker-compose logs backend
   ```

3. Rebuild container:
   ```bash
   docker-compose build --no-cache backend
   docker-compose up -d backend
   ```

### 404 errors on page navigation

- Make sure `base: '/docs-website/'` is set in `vite.config.js`
- Ensure FastAPI is using `html=True` in StaticFiles mount

### Styles not loading

- Check that assets are being built in `dist/assets/`
- Verify Tailwind CSS is processing correctly
- Check browser console for 404 errors on CSS files

---

## Production Checklist

- [ ] Documentation content is complete and accurate
- [ ] All links work correctly
- [ ] Code examples are tested
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] Fast load time
- [ ] Search functionality works (if implemented)
- [ ] Analytics added (if needed)

---

**Access Documentation:** https://api.hremsoftconsulting.com/docs-website/

**Swagger UI:** https://api.hremsoftconsulting.com/docs

