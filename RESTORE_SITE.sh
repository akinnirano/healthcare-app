#!/bin/bash

# RESTORE SITE - Simple 5-step fix
# Fixes EmailStr error and gets your site back online

echo "=========================================="
echo "🚀 RESTORING SITE"
echo "=========================================="
echo ""

# Step 1: Pull latest code (has EmailStr fix)
echo "1️⃣  Pulling latest code..."
git pull origin main
echo "✅ Latest code pulled"
echo ""

# Step 2: Add database columns (quick and safe)
echo "2️⃣  Adding database columns..."
sudo docker exec -i healthcare_db psql -U postgres -d healthcare << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_id INTEGER;
EOF
echo "✅ Database columns added"
echo ""

# Step 3: Rebuild backend (gets new code without EmailStr)
echo "3️⃣  Rebuilding backend (3-5 minutes)..."
sudo docker-compose build backend
echo "✅ Backend rebuilt"
echo ""

# Step 4: Start backend
echo "4️⃣  Starting backend..."
sudo docker-compose up -d backend
echo "✅ Backend starting..."
echo ""

# Step 5: Wait and verify
echo "5️⃣  Waiting 20 seconds for backend to start..."
sleep 20
echo ""

echo "📊 Container status:"
sudo docker ps | grep healthcare
echo ""

echo "🧪 Testing site..."
curl -I https://api.hremsoftconsulting.com/docs
echo ""

echo "=========================================="
echo "✅ SITE SHOULD BE ONLINE NOW!"
echo "=========================================="
echo ""
echo "Test: https://api.hremsoftconsulting.com/docs"
echo ""
echo "If still not working, check logs:"
echo "  sudo docker-compose logs backend | tail -50"
echo ""

