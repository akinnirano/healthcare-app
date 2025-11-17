"""
Static Content API Endpoints
Provides privacy policy, terms of service, and other static content pages
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

# =========================================================
# PRIVACY POLICY
# =========================================================
PRIVACY_POLICY_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Healthcare Management Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0ea5e9;
            border-bottom: 3px solid #0ea5e9;
            padding-bottom: 10px;
        }
        h2 {
            color: #0369a1;
            margin-top: 30px;
        }
        p {
            margin-bottom: 15px;
        }
        .last-updated {
            color: #666;
            font-style: italic;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Privacy Policy</h1>
        <p class="last-updated">Last Updated: {last_updated}</p>
        
        <h2>1. Introduction</h2>
        <p>Welcome to the Healthcare Management Platform. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
        
        <h2>2. Information We Collect</h2>
        <p>We collect information that you provide directly to us, including:</p>
        <ul>
            <li>Personal identification information (name, email address, phone number)</li>
            <li>Professional information (license numbers, certifications, skills)</li>
            <li>Location data (for staff tracking and assignment purposes)</li>
            <li>Health information (for patient care and service delivery)</li>
            <li>Payment and billing information</li>
        </ul>
        
        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and manage payroll</li>
            <li>Send you notifications and updates</li>
            <li>Comply with legal obligations</li>
            <li>Ensure the safety and security of our platform</li>
        </ul>
        
        <h2>4. Information Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
        <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
            <li>With service providers who assist in our operations</li>
        </ul>
        
        <h2>5. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        
        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to processing of your information</li>
            <li>Data portability</li>
        </ul>
        
        <h2>7. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us at:</p>
        <p>Email: privacy@hremsoftconsulting.com</p>
        
        <h2>8. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
    </div>
</body>
</html>
"""

# =========================================================
# TERMS OF SERVICE
# =========================================================
TERMS_OF_SERVICE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - Healthcare Management Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0ea5e9;
            border-bottom: 3px solid #0ea5e9;
            padding-bottom: 10px;
        }
        h2 {
            color: #0369a1;
            margin-top: 30px;
        }
        p {
            margin-bottom: 15px;
        }
        .last-updated {
            color: #666;
            font-style: italic;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Terms of Service</h1>
        <p class="last-updated">Last Updated: {last_updated}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using the Healthcare Management Platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2>2. Use License</h2>
        <p>Permission is granted to temporarily use the Healthcare Management Platform for personal and commercial healthcare management purposes. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
        <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose without explicit permission</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or other proprietary notations</li>
        </ul>
        
        <h2>3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
        
        <h2>4. User Conduct</h2>
        <p>You agree to use the platform only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the platform.</p>
        
        <h2>5. Healthcare Information</h2>
        <p>All healthcare information provided through the platform is for management and coordination purposes only. It does not constitute medical advice, diagnosis, or treatment.</p>
        
        <h2>6. Payment Terms</h2>
        <p>Payment for services is processed according to the terms agreed upon in your service agreement. All fees are non-refundable unless otherwise stated.</p>
        
        <h2>7. Intellectual Property</h2>
        <p>The platform and its original content, features, and functionality are owned by HREM Soft Consulting and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
        
        <h2>8. Limitation of Liability</h2>
        <p>In no event shall HREM Soft Consulting or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the platform.</p>
        
        <h2>9. Termination</h2>
        <p>We may terminate or suspend your account and access to the platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        
        <h2>10. Changes to Terms</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.</p>
        
        <h2>11. Contact Information</h2>
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <p>Email: support@hremsoftconsulting.com</p>
    </div>
</body>
</html>
"""

@router.get("/privacy-policy", response_class=HTMLResponse, summary="Privacy Policy page")
def get_privacy_policy():
    """
    Returns the Privacy Policy page as HTML
    """
    last_updated = datetime.utcnow().strftime("%B %d, %Y")
    return PRIVACY_POLICY_HTML.format(last_updated=last_updated)

@router.get("/terms-of-service", response_class=HTMLResponse, summary="Terms of Service page")
def get_terms_of_service():
    """
    Returns the Terms of Service page as HTML
    """
    last_updated = datetime.utcnow().strftime("%B %d, %Y")
    return TERMS_OF_SERVICE_HTML.format(last_updated=last_updated)

