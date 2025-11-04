#!/bin/bash
# Documentation Website Deployment Script

echo "🚀 Deploying Documentation Website to Server..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pull latest changes
echo -e "${YELLOW}Step 1: Pulling latest changes from GitHub...${NC}"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Git pull successful${NC}"
else
    echo -e "${RED}✗ Git pull failed${NC}"
    exit 1
fi

echo ""

# Step 2: Rebuild backend container (includes docs-website build)
echo -e "${YELLOW}Step 2: Rebuilding backend container (this will take a few minutes)...${NC}"
docker-compose build --no-cache backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend build successful${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

echo ""

# Step 3: Restart backend
echo -e "${YELLOW}Step 3: Restarting backend service...${NC}"
docker-compose up -d backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend restarted successfully${NC}"
else
    echo -e "${RED}✗ Failed to restart backend${NC}"
    exit 1
fi

echo ""

# Step 4: Wait for backend to start
echo -e "${YELLOW}Step 4: Waiting for backend to start...${NC}"
sleep 5

# Step 5: Verify docs are accessible
echo -e "${YELLOW}Step 5: Verifying documentation is accessible...${NC}"

# Check if dist folder exists
docker exec healthcare_backend ls /app/docs-website/dist/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Documentation files found in container${NC}"
else
    echo -e "${RED}✗ Documentation files not found in container${NC}"
    echo -e "${YELLOW}  Checking backend logs...${NC}"
    docker-compose logs backend | tail -20
    exit 1
fi

# Test local access
curl -s http://localhost:8009/docs-website/ > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Documentation accessible on localhost${NC}"
else
    echo -e "${RED}✗ Documentation not accessible on localhost${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Access documentation at:"
echo -e "${GREEN}https://api.hremsoftconsulting.com/docs-website/getting-started${NC}"
echo ""
echo -e "Check backend logs with:"
echo -e "  docker-compose logs -f backend"
echo ""

