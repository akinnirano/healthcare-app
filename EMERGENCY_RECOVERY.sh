#!/bin/bash

# EMERGENCY RECOVERY SCRIPT
# Quickly restore services if they're down

echo "=========================================="
echo "🚨 EMERGENCY RECOVERY"
echo "=========================================="
echo ""

# Step 1: Check current status
echo "📊 Step 1: Checking container status..."
sudo docker ps -a
echo ""

# Step 2: Try simple restart first
echo "🔄 Step 2: Attempting simple restart..."
sudo docker-compose restart
echo ""
sleep 5

# Step 3: Check if services are up
echo "🔍 Step 3: Checking if services are running..."
if sudo docker ps | grep -q "healthcare_backend"; then
  echo "✅ Backend is running!"
  echo ""
  echo "Testing site:"
  curl -s -o /dev/null -w "Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs
  echo ""
  echo "✅ Site should be accessible now!"
  exit 0
fi

echo "⚠️  Services not running. Trying recovery..."
echo ""

# Step 4: Clean restart
echo "🔄 Step 4: Clean restart (without rebuilding)..."
sudo docker-compose down
sleep 2
sudo docker-compose up -d
echo ""

# Step 5: Wait for startup
echo "⏳ Step 5: Waiting 15 seconds for services to start..."
sleep 15
echo ""

# Step 6: Check again
echo "🔍 Step 6: Checking status..."
sudo docker ps
echo ""

# Step 7: Test endpoint
echo "🧪 Step 7: Testing site..."
curl -s -o /dev/null -w "Main site status: %{http_code}\n" https://api.hremsoftconsulting.com/docs
curl -s -o /dev/null -w "Docs site status: %{http_code}\n" https://api.hremsoftconsulting.com/docs-website/login
echo ""

# Step 8: Show logs if still down
if ! sudo docker ps | grep -q "healthcare_backend"; then
  echo "❌ Backend still not running. Checking logs..."
  echo ""
  sudo docker-compose logs backend | tail -50
  echo ""
  echo "=========================================="
  echo "⚠️  MANUAL INTERVENTION NEEDED"
  echo "=========================================="
  echo ""
  echo "If you see image/build errors, run:"
  echo "  ./fix-docker-and-deploy.sh"
  echo ""
  echo "If you see database errors, the database might be down:"
  echo "  sudo docker-compose up -d healthcare_db"
  echo "  sleep 10"
  echo "  sudo docker-compose up -d backend"
  echo ""
else
  echo "=========================================="
  echo "✅ RECOVERY SUCCESSFUL!"
  echo "=========================================="
  echo ""
  echo "Your site should be accessible at:"
  echo "  https://api.hremsoftconsulting.com"
  echo ""
fi

