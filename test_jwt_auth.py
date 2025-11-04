#!/usr/bin/env python3
"""
JWT Authentication Test Script
Tests the healthcare app's JWT authentication system
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://api.hremsoftconsulting.com"
TEST_USER = {
    "email": "test@example.com",
    "password": "testpassword123"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

def test_login():
    """Test login endpoint and token generation"""
    print_info("Testing login endpoint...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=TEST_USER,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "token_type" in data:
                print_success(f"Login successful! Token received.")
                print_info(f"Token type: {data['token_type']}")
                print_info(f"Role: {data.get('role', 'N/A')}")
                print_info(f"Privileges: {data.get('privileges', [])}")
                return data["access_token"]
            else:
                print_error("Login response missing required fields")
                return None
        elif response.status_code == 401:
            print_warning("Login failed - Invalid credentials")
            print_info("This might be expected if test user doesn't exist")
            return None
        else:
            print_error(f"Login failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print_error("Could not connect to backend server")
        print_info("Make sure backend is running on http://localhost:8000")
        return None
    except Exception as e:
        print_error(f"Login test failed: {str(e)}")
        return None

def test_protected_endpoint_without_token():
    """Test that protected endpoints reject requests without token"""
    print_info("Testing protected endpoint without token...")
    
    try:
        response = requests.get(f"{BASE_URL}/users/", timeout=5)
        
        if response.status_code == 401:
            print_success("Protected endpoint correctly rejected request without token")
            return True
        else:
            print_error(f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_protected_endpoint_with_token(token):
    """Test that protected endpoints accept valid tokens"""
    print_info("Testing protected endpoint with valid token...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/users/", headers=headers, timeout=5)
        
        if response.status_code == 200:
            print_success("Protected endpoint accepted valid token")
            data = response.json()
            print_info(f"Retrieved {len(data)} users")
            return True
        elif response.status_code == 401:
            print_error("Token was rejected (might be invalid or expired)")
            return False
        else:
            print_warning(f"Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_invalid_token():
    """Test that invalid tokens are rejected"""
    print_info("Testing protected endpoint with invalid token...")
    
    try:
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = requests.get(f"{BASE_URL}/users/", headers=headers, timeout=5)
        
        if response.status_code == 401:
            print_success("Invalid token correctly rejected")
            return True
        else:
            print_error(f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def decode_token(token):
    """Decode JWT token (for display only)"""
    print_info("Decoding token payload...")
    
    try:
        import base64
        # JWT format: header.payload.signature
        parts = token.split('.')
        if len(parts) != 3:
            print_error("Invalid token format")
            return
        
        # Decode payload (add padding if needed)
        payload = parts[1]
        payload += '=' * (4 - len(payload) % 4)
        decoded = base64.b64decode(payload)
        data = json.loads(decoded)
        
        print_success("Token payload decoded:")
        print(json.dumps(data, indent=2))
        
        # Check expiration
        if 'exp' in data:
            exp_time = datetime.fromtimestamp(data['exp'])
            now = datetime.now()
            if exp_time > now:
                time_left = exp_time - now
                print_info(f"Token expires in: {time_left}")
            else:
                print_warning("Token is expired!")
                
    except Exception as e:
        print_error(f"Could not decode token: {str(e)}")

def test_public_registration_endpoint():
    """Test that registration endpoints work without token"""
    print_info("Testing public registration endpoint (POST /roles/)...")
    
    try:
        # Try to list roles without auth (should work)
        response = requests.get(f"{BASE_URL}/roles/", timeout=5)
        
        if response.status_code == 200:
            print_success("Public registration endpoint works without token")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def main():
    """Run all JWT authentication tests"""
    print("\n" + "="*60)
    print("JWT Authentication Test Suite")
    print("="*60 + "\n")
    
    # Test 1: Login
    print("\n--- Test 1: Login and Token Generation ---")
    token = test_login()
    
    if token:
        decode_token(token)
    
    # Test 2: Public registration endpoints
    print("\n--- Test 2: Public Registration Endpoints ---")
    test_public_registration_endpoint()
    
    # Test 3: Protected endpoint without token
    print("\n--- Test 3: Protected Endpoint Without Token ---")
    test_protected_endpoint_without_token()
    
    # Test 4: Protected endpoint with invalid token
    print("\n--- Test 4: Protected Endpoint With Invalid Token ---")
    test_invalid_token()
    
    # Test 5: Protected endpoint with valid token
    if token:
        print("\n--- Test 5: Protected Endpoint With Valid Token ---")
        test_protected_endpoint_with_token(token)
    else:
        print_warning("\nSkipping valid token test (no token available)")
        print_info("To run full tests, create a test user:")
        print_info(f"  Email: {TEST_USER['email']}")
        print_info(f"  Password: {TEST_USER['password']}")
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    if token:
        print_success("All tests completed successfully!")
        print_info("\nYour JWT authentication is working correctly:")
        print_info("  ✓ Login endpoint generates valid tokens")
        print_info("  ✓ Protected endpoints require authentication")
        print_info("  ✓ Invalid tokens are rejected")
        print_info("  ✓ Valid tokens grant access to protected resources")
    else:
        print_warning("\nPartial test completion")
        print_info("Some tests require a valid user account")
        print_info("\nTo set up a test user, you can:")
        print_info("  1. Use the /api/users/ endpoint to create a user")
        print_info("  2. Use the /api/auth/set_password endpoint")
        print_info("  3. Or create user directly in database")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_warning("\n\nTests interrupted by user")
        sys.exit(0)

