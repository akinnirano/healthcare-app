#!/bin/bash

# Quick Deployment Script for Documentation Website Fix
# Run this on your server to deploy the blank page fix

set -e  # Exit on error

echo "=========================================="
echo "📦 Deploying Documentation Website Fix"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pull latest changes
echo -e "${YELLOW}Step 1/4: Pulling latest changes...${NC}"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Code updated successfully${NC}"
else
    echo -e "${RED}✗ Failed to pull changes${NC}"
    exit 1
fi
echo ""

# Step 2: Rebuild backend container
echo -e "${YELLOW}Step 2/4: Rebuilding backend container (this may take 2-3 minutes)...${NC}"
docker-compose build --no-cache backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend container rebuilt${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Step 3: Restart backend
echo -e "${YELLOW}Step 3/4: Restarting backend service...${NC}"
docker-compose up -d backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend restarted${NC}"
else
    echo -e "${RED}✗ Restart failed${NC}"
    exit 1
fi
echo ""

# Wait for backend to be ready
echo -e "${YELLOW}Waiting 5 seconds for backend to initialize...${NC}"
sleep 5
echo ""

# Step 4: Verify deployment
echo -e "${YELLOW}Step 4/4: Verifying deployment...${NC}"
echo ""

# Check if docs-website is mounted
echo "Checking backend logs for docs-website mounting..."
docker-compose logs backend | grep -E "docs-website|Found|Mounted|React Router" | tail -10

echo ""
echo "Checking if backend is responding..."
docker-compose ps backend

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Test locally from server:"
echo "   docker exec healthcare_backend curl -I http://localhost:8009/docs-website/"
echo ""
echo "2. Test externally:"
echo "   curl -I https://api.hremsoftconsulting.com/docs-website/"
echo ""
echo "3. Visit in browser:"
echo "   https://api.hremsoftconsulting.com/docs-website/getting-started"
echo ""
echo "4. Check browser console (F12) for any errors"
echo ""
echo "=========================================="
echo ""
echo "Expected in logs above:"
echo "  ✓ Found docs-website at: /app/docs-website/dist"
echo "  ✓ Mounted documentation website at /docs-website/"
echo "  ✓ React Router SPA support enabled"
echo ""
echo "If you see these ✓ symbols, the fix is deployed!"
echo "=========================================="

