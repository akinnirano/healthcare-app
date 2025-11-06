#!/bin/bash

# Start Backend and Fix Issues
# Quick script to get backend running

echo "=========================================="
echo "🚀 Starting Backend Container"
echo "=========================================="
echo ""

# Check what containers are running
echo "📊 Current containers:"
sudo docker ps
echo ""

# Check if backend container exists but is stopped
echo "📋 Checking for stopped backend..."
sudo docker ps -a | grep backend
echo ""

# Check backend logs from last run (to see why it failed)
echo "📋 Backend logs (last attempt):"
sudo docker-compose logs backend | tail -30
echo ""

# Try to start backend
echo "🚀 Starting backend service..."
sudo docker-compose up -d backend
echo ""

# Wait
echo "⏳ Waiting 15 seconds for backend to start..."
sleep 15
echo ""

# Check if it's running now
echo "📊 Current status:"
sudo docker ps | grep healthcare
echo ""

if sudo docker ps | grep -q "healthcare_backend"; then
  echo "✅ Backend is RUNNING!"
  echo ""
  echo "Testing endpoint..."
  curl -I https://api.hremsoftconsulting.com/docs
  echo ""
  echo "✅ Site should be accessible now!"
else
  echo "❌ Backend failed to start."
  echo ""
  echo "📋 Checking why it failed..."
  echo ""
  sudo docker-compose logs backend | tail -50
  echo ""
  echo "=========================================="
  echo "🔧 TROUBLESHOOTING"
  echo "=========================================="
  echo ""
  echo "Backend failed to start. Common causes:"
  echo ""
  echo "1. Import/Model errors (company_id, country_id)"
  echo "   Fix: Remove the new columns from models temporarily"
  echo ""
  echo "2. Build failed"
  echo "   Fix: sudo docker-compose build backend"
  echo ""
  echo "3. Port conflict (8009 already in use)"
  echo "   Fix: sudo lsof -ti:8009 | xargs kill -9"
  echo ""
  echo "Try rebuilding:"
  echo "  sudo docker-compose build backend"
  echo "  sudo docker-compose up -d backend"
  echo ""
fi

