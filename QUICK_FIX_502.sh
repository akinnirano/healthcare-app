#!/bin/bash

# QUICK FIX for 502 Bad Gateway
# Uses correct service names from docker-compose.yml

echo "=========================================="
echo "🚨 QUICK FIX - 502 Bad Gateway"
echo "=========================================="
echo ""

# Step 1: Check current status
echo "📊 Current container status:"
sudo docker ps -a | grep healthcare
echo ""

# Step 2: Stop everything cleanly
echo "🛑 Stopping all services..."
sudo docker-compose down
echo "✅ Stopped"
echo ""

# Step 3: Start database (service name is 'db')
echo "🗄️  Starting database..."
sudo docker-compose up -d db
echo "✅ Database starting..."
echo ""

# Step 4: Wait for database
echo "⏳ Waiting for database (20 seconds)..."
sleep 20
echo ""

# Step 5: Check database
echo "🔍 Checking database..."
if sudo docker exec healthcare_db pg_isready -U postgres; then
  echo "✅ Database is ready"
else
  echo "⚠️  Database not ready yet, waiting more..."
  sleep 10
fi
echo ""

# Step 6: Add missing columns (minimal, safe migration)
echo "🗄️  Adding missing database columns (safe operation)..."
sudo docker exec -i healthcare_db psql -U postgres -d healthcare << 'EOSQL'
-- Safely add columns only if they don't exist
DO $$ 
BEGIN
  -- Add company_id to users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='company_id'
  ) THEN
    ALTER TABLE users ADD COLUMN company_id INTEGER;
    RAISE NOTICE 'Added company_id to users';
  END IF;
  
  -- Add country_id to users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='country_id'
  ) THEN
    ALTER TABLE users ADD COLUMN country_id INTEGER;
    RAISE NOTICE 'Added country_id to users';
  END IF;
END $$;

-- Show users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='users' 
ORDER BY ordinal_position;
EOSQL

echo "✅ Database columns added"
echo ""

# Step 7: Start backend
echo "🚀 Starting backend..."
sudo docker-compose up -d backend
echo "✅ Backend starting..."
echo ""

# Step 8: Wait for backend
echo "⏳ Waiting for backend (20 seconds)..."
sleep 20
echo ""

# Step 9: Check if containers are running
echo "📊 Container status:"
sudo docker ps | grep healthcare
echo ""

# Step 10: Check backend logs
echo "📋 Backend logs (last 20 lines):"
sudo docker-compose logs backend | tail -20
echo ""

# Step 11: Test endpoints
echo "🧪 Testing endpoints..."
echo ""
echo "Swagger docs:"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" https://api.hremsoftconsulting.com/docs
echo ""
echo "Docs website:"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" https://api.hremsoftconsulting.com/docs-website/login
echo ""
echo "Main API health:"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:8009/docs || echo "  ❌ Backend not responding on localhost"
echo ""

# Final status
echo "=========================================="
echo "✅ FIX COMPLETE"
echo "=========================================="
echo ""
echo "🔗 Test your site:"
echo "   https://api.hremsoftconsulting.com/docs"
echo ""
echo "If still getting 502:"
echo "1. Check backend logs: sudo docker-compose logs backend"
echo "2. Check nginx status: sudo systemctl status nginx"
echo "3. Verify backend port: sudo docker port healthcare_backend"
echo ""

