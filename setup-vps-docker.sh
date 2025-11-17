#!/bin/bash

# VPS Docker Setup Script
# Run this script on your VPS server to configure docker permissions
# Usage: bash setup-vps-docker.sh

set -e

echo "=========================================="
echo "🔧 VPS Docker Permission Setup"
echo "=========================================="
echo ""

# Get current user
CURRENT_USER=$(whoami)
echo "Current user: $CURRENT_USER"
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
    echo ""
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
    echo ""
fi

# Option 1: Add user to docker group (Recommended)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Option 1: Adding user to docker group (Recommended)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if user is already in docker group
if groups | grep -q docker; then
    echo "✅ User is already in docker group"
else
    echo "Adding user to docker group..."
    sudo usermod -aG docker $CURRENT_USER
    echo "✅ User added to docker group"
    echo ""
    echo "⚠️  IMPORTANT: You need to logout and login again for changes to take effect"
    echo "   Or run: newgrp docker"
    echo ""
fi

# Option 2: Configure passwordless sudo for docker
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Option 2: Configuring passwordless sudo for docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if passwordless sudo is already configured
SUDOERS_LINE="$CURRENT_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/local/bin/docker-compose, /usr/bin/docker-compose"

if sudo grep -q "^$SUDOERS_LINE$" /etc/sudoers 2>/dev/null; then
    echo "✅ Passwordless sudo for docker is already configured"
else
    echo "Configuring passwordless sudo for docker..."
    echo ""
    echo "Adding this line to /etc/sudoers:"
    echo "  $SUDOERS_LINE"
    echo ""
    
    # Create a temporary file with the sudoers entry
    TEMP_SUDOERS=$(mktemp)
    echo "$SUDOERS_LINE" | sudo tee "$TEMP_SUDOERS" > /dev/null
    
    # Validate and add to sudoers
    if sudo visudo -cf "$TEMP_SUDOERS" 2>/dev/null; then
        echo "$SUDOERS_LINE" | sudo tee -a /etc/sudoers > /dev/null
        echo "✅ Passwordless sudo configured"
    else
        echo "❌ Error: Invalid sudoers syntax. Please configure manually:"
        echo "   sudo visudo"
        echo "   Add: $SUDOERS_LINE"
        rm "$TEMP_SUDOERS"
        exit 1
    fi
    
    rm "$TEMP_SUDOERS"
fi

echo ""
echo "=========================================="
echo "🧪 Testing Docker Permissions"
echo "=========================================="
echo ""

# Test docker without sudo
echo "Test 1: Running docker without sudo..."
if docker ps > /dev/null 2>&1; then
    echo "✅ SUCCESS: Docker works without sudo!"
    echo ""
    echo "🎉 Setup complete! Docker can be used without sudo."
    exit 0
else
    echo "⚠️  Docker without sudo failed, testing with passwordless sudo..."
fi

# Test docker with passwordless sudo
echo ""
echo "Test 2: Running docker with passwordless sudo..."
if sudo -n docker ps > /dev/null 2>&1; then
    echo "✅ SUCCESS: Passwordless sudo works for docker!"
    echo ""
    echo "🎉 Setup complete! Docker can be used with passwordless sudo."
    exit 0
else
    echo "❌ FAILED: Neither option works"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Manual Configuration Required"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Please try one of these:"
    echo ""
    echo "1. Logout and login again (to apply docker group changes):"
    echo "   exit"
    echo "   ssh your_username@78.138.17.185"
    echo "   docker ps  # Should work now"
    echo ""
    echo "2. Or manually configure passwordless sudo:"
    echo "   sudo visudo"
    echo "   Add this line at the end:"
    echo "   $SUDOERS_LINE"
    echo ""
    exit 1
fi

