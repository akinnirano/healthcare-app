#!/bin/bash

# Fix 502 Bad Gateway Error
# This script diagnoses and fixes backend connectivity issues

set -e

echo "=========================================="
echo "🔧 FIXING 502 BAD GATEWAY ERROR"
echo "=========================================="
echo ""

# Step 1: Check if containers exist
echo "📊 Step 1: Checking container status..."
sudo docker ps -a | grep healthcare || echo "No healthcare containers found"
echo ""

# Step 2: Check if backend container is running
echo "🔍 Step 2: Checking backend container..."
if sudo docker ps | grep -q "healthcare_backend"; then
  echo "✅ Backend container is running"
  BACKEND_RUNNING=true
else
  echo "❌ Backend container is NOT running"
  BACKEND_RUNNING=false
fi
echo ""

# Step 3: Check if database is running
echo "🔍 Step 3: Checking database container..."
if sudo docker ps | grep -q "healthcare_db"; then
  echo "✅ Database container is running"
  DB_RUNNING=true
else
  echo "❌ Database container is NOT running"
  DB_RUNNING=false
fi
echo ""

# Step 4: Check backend logs for errors
if [ "$BACKEND_RUNNING" = true ]; then
  echo "📋 Step 4: Checking backend logs (last 50 lines)..."
  sudo docker-compose logs backend | tail -50
  echo ""
  
  # Check for common errors
  if sudo docker-compose logs backend | tail -50 | grep -q "Error\|Exception\|Traceback"; then
    echo "⚠️  Errors found in backend logs!"
    echo ""
  fi
fi

# Step 5: Stop everything
echo "🛑 Step 5: Stopping all services..."
sudo docker-compose down
echo "✅ Services stopped"
echo ""

# Step 6: Start database first
echo "🗄️  Step 6: Starting database..."
sudo docker-compose up -d healthcare_db
echo "✅ Database starting..."
echo ""

# Step 7: Wait for database
echo "⏳ Step 7: Waiting for database to be ready..."
for i in {1..30}; do
  if sudo docker exec healthcare_db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is ready"
    break
  fi
  echo "   Waiting... ($i/30)"
  sleep 2
done
echo ""

# Step 8: Check if we need to run migration
echo "🔍 Step 8: Checking if migration is needed..."
MIGRATION_NEEDED=false
if ! sudo docker exec healthcare_db psql -U postgres -d healthcare -c "\d users" 2>/dev/null | grep -q "company_id"; then
  echo "⚠️  Migration needed (company_id column missing)"
  MIGRATION_NEEDED=true
else
  echo "✅ Database schema looks good"
fi
echo ""

# Step 9: Run minimal migration if needed (just add columns, don't break existing)
if [ "$MIGRATION_NEEDED" = true ]; then
  echo "🗄️  Step 9: Running minimal migration (adding columns only)..."
  sudo docker exec -i healthcare_db psql -U postgres -d healthcare << 'EOSQL'
-- Add columns only if they don't exist (safe migration)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='company_id') THEN
    ALTER TABLE users ADD COLUMN company_id INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country_id') THEN
    ALTER TABLE users ADD COLUMN country_id INTEGER;
  END IF;
END $$;
EOSQL
  echo "✅ Minimal migration completed"
  echo ""
fi

# Step 10: Start backend
echo "🚀 Step 10: Starting backend..."
sudo docker-compose up -d backend
echo "✅ Backend starting..."
echo ""

# Step 11: Wait for backend
echo "⏳ Step 11: Waiting 20 seconds for backend to start..."
sleep 20
echo ""

# Step 12: Check backend status
echo "🔍 Step 12: Checking backend status..."
if sudo docker ps | grep -q "healthcare_backend"; then
  echo "✅ Backend container is running"
  
  # Check if it's actually responding
  echo ""
  echo "Testing backend health..."
  sleep 5
  
  # Check logs for startup errors
  echo ""
  echo "Recent backend logs:"
  sudo docker-compose logs backend | tail -20
  echo ""
  
  # Test internal port
  echo "Testing backend on internal port..."
  if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo "✅ Backend is responding on port 8000"
  else
    echo "⚠️  Backend not responding on port 8000"
    echo "Checking what port it's using..."
    sudo docker port healthcare_backend
  fi
else
  echo "❌ Backend container failed to start"
  echo ""
  echo "Last 30 lines of backend logs:"
  sudo docker-compose logs backend | tail -30
  echo ""
  echo "⚠️  Backend has errors. Trying to rebuild..."
  
  # Try rebuilding
  echo ""
  echo "🏗️  Rebuilding backend..."
  sudo docker-compose build backend
  sudo docker-compose up -d backend
  sleep 15
fi
echo ""

# Step 13: Test external endpoint
echo "🧪 Step 13: Testing external endpoints..."
echo ""
echo "Main API docs:"
curl -s -o /dev/null -w "  Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs || echo "  ❌ Connection failed"
echo ""
echo "Docs website login:"
curl -s -o /dev/null -w "  Status: %{http_code}\n" https://api.hremsoftconsulting.com/docs-website/login || echo "  ❌ Connection failed"
echo ""

# Step 14: Check nginx/reverse proxy
echo "🔍 Step 14: Checking reverse proxy configuration..."
if command -v nginx > /dev/null 2>&1; then
  echo "Nginx status:"
  sudo systemctl status nginx --no-pager | head -5 || echo "Nginx not found or not systemd managed"
fi
echo ""

# Final summary
echo "=========================================="
echo "📊 DIAGNOSIS SUMMARY"
echo "=========================================="
echo ""

if sudo docker ps | grep -q "healthcare_backend"; then
  echo "✅ Backend container: RUNNING"
else
  echo "❌ Backend container: NOT RUNNING"
fi

if sudo docker ps | grep -q "healthcare_db"; then
  echo "✅ Database container: RUNNING"
else
  echo "❌ Database container: NOT RUNNING"
fi

echo ""
echo "📋 Next Steps:"
echo ""
if ! sudo docker ps | grep -q "healthcare_backend"; then
  echo "1. Backend is not running. Check logs:"
  echo "   sudo docker-compose logs backend"
  echo ""
  echo "2. If you see import errors, rebuild:"
  echo "   sudo docker-compose build --no-cache backend"
  echo "   sudo docker-compose up -d backend"
  echo ""
  echo "3. If you see database errors, check database:"
  echo "   sudo docker-compose logs healthcare_db"
  echo ""
else
  echo "✅ Containers are running!"
  echo ""
  echo "If you still get 502:"
  echo "1. Check nginx/reverse proxy configuration"
  echo "2. Verify backend port mapping:"
  echo "   sudo docker port healthcare_backend"
  echo "3. Test backend directly:"
  echo "   curl http://localhost:8000/docs"
  echo ""
fi

echo ""
echo "🔗 Test your site:"
echo "   https://api.hremsoftconsulting.com/docs"
echo ""

