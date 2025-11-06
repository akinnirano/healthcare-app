#!/bin/bash

# Deployment script for Documentation Authentication System
# This script deploys the new authentication system to the server

set -e  # Exit on error

echo "=========================================="
echo "Documentation Authentication Deployment"
echo "=========================================="
echo ""

# Step 1: Pull latest code
echo "📥 Step 1: Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code updated"
echo ""

# Step 2: Create database table for API keys
echo "🗄️  Step 2: Creating docs_api_keys table..."
docker exec -i healthcare_db psql -U postgres -d healthcare << 'EOF'
-- Create docs_api_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS docs_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL,
    createdby VARCHAR(255) DEFAULT 'system',
    datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_docs_api_keys_user_id ON docs_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_docs_api_keys_key ON docs_api_keys(key);
CREATE INDEX IF NOT EXISTS idx_docs_api_keys_is_active ON docs_api_keys(is_active);

-- Display table info
\d docs_api_keys

-- Show count
SELECT COUNT(*) as total_api_keys FROM docs_api_keys;
EOF
echo "✅ Database table created"
echo ""

# Step 3: Rebuild backend (includes docs-website build)
echo "🏗️  Step 3: Rebuilding backend with docs-website..."
docker-compose build --no-cache backend
echo "✅ Backend built successfully"
echo ""

# Step 4: Restart services
echo "🔄 Step 4: Restarting services..."
docker-compose up -d backend
echo "✅ Services restarted"
echo ""

# Step 5: Wait for services to start
echo "⏳ Waiting 10 seconds for services to stabilize..."
sleep 10
echo ""

# Step 6: Check backend logs
echo "📋 Step 6: Checking backend logs (last 30 lines)..."
docker-compose logs backend | tail -30
echo ""

# Step 7: Verify documentation website
echo "🔍 Step 7: Verifying deployment..."
echo ""
echo "Testing login page:"
curl -I https://api.hremsoftconsulting.com/docs-website/login 2>/dev/null | head -1
echo ""
echo "Testing protected page (should redirect):"
curl -I https://api.hremsoftconsulting.com/docs-website/getting-started 2>/dev/null | head -1
echo ""

# Step 8: Final instructions
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Visit: https://api.hremsoftconsulting.com/docs-website/login"
echo "   - You should see the new login page"
echo ""
echo "2. Log in with any Healthcare application credentials"
echo "   - Use email/phone and password from the main app"
echo ""
echo "3. After login, visit: https://api.hremsoftconsulting.com/docs-website/getting-started"
echo "   - You should see the documentation"
echo "   - Header should show your email with a user menu"
echo ""
echo "4. Click your email in header → API Key"
echo "   - You should see your auto-generated API key"
echo ""
echo "🔒 Security Notes:"
echo "   - All documentation pages now require authentication"
echo "   - Each user gets a unique API key"
echo "   - Sessions persist across browser tabs"
echo "   - Auto-logout on token expiration"
echo ""
echo "📊 Database Stats:"
docker exec -i healthcare_db psql -U postgres -d healthcare -c "SELECT COUNT(*) as users_with_api_keys FROM docs_api_keys WHERE is_active = true;"
echo ""
echo "🎉 Deployment completed successfully!"

