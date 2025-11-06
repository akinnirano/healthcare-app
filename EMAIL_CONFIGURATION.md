# Email Configuration Guide

## 📧 Overview

Welcome emails are now sent automatically when users register on the docs-website. This guide shows you how to configure SMTP for email delivery.

---

## ✨ What Users Receive

When someone registers, they get a beautiful welcome email with:
- 🎉 Welcome message with their name
- 📋 Account details (email, company, role)
- 🔗 One-click login button
- 📚 Getting started checklist
- 🔑 API key generation instructions
- 📞 Support information

---

## 🔧 SMTP Configuration (Server)

### Option 1: Using Gmail (Recommended for Testing)

1. **Get Gmail App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate app password for "Mail"

2. **Add to docker-compose.yml:**

```yaml
services:
  backend:
    environment:
      - DATABASE_URL=postgresql://postgres:postgressql15@db:5432/healthcare
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=your-email@gmail.com
      - SMTP_PASSWORD=your-app-password
      - SMTP_TLS=true
      - MAIL_FROM=noreply@hremsoftconsulting.com
      - FRONTEND_BASE_URL=https://api.hremsoftconsulting.com
```

3. **Restart backend:**
```bash
sudo docker-compose down
sudo docker-compose up -d
```

---

### Option 2: Using SendGrid

```yaml
services:
  backend:
    environment:
      - SMTP_HOST=smtp.sendgrid.net
      - SMTP_PORT=587
      - SMTP_USER=apikey
      - SMTP_PASSWORD=your-sendgrid-api-key
      - SMTP_TLS=true
      - MAIL_FROM=noreply@hremsoftconsulting.com
```

---

### Option 3: Using AWS SES

```yaml
services:
  backend:
    environment:
      - SMTP_HOST=email-smtp.us-east-1.amazonaws.com
      - SMTP_PORT=587
      - SMTP_USER=your-aws-smtp-username
      - SMTP_PASSWORD=your-aws-smtp-password
      - SMTP_TLS=true
      - MAIL_FROM=noreply@hremsoftconsulting.com
```

---

### Option 4: Using Custom SMTP Server

```yaml
services:
  backend:
    environment:
      - SMTP_HOST=mail.yourserver.com
      - SMTP_PORT=587
      - SMTP_USER=noreply@hremsoftconsulting.com
      - SMTP_PASSWORD=your-password
      - SMTP_TLS=true
      - MAIL_FROM=noreply@hremsoftconsulting.com
```

---

## 🚀 Quick Setup (Gmail Example)

### Step 1: Edit docker-compose.yml on Server

```bash
cd ~/healthcare-app
nano docker-compose.yml
```

Add under `backend` → `environment`:

```yaml
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=your-email@gmail.com
      - SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Your app password
      - SMTP_TLS=true
      - MAIL_FROM=info@hremsoftconsulting.com
```

### Step 2: Restart Backend

```bash
sudo docker-compose down
sudo docker-compose up -d
```

### Step 3: Test Registration

Register a new user and check their email inbox!

---

## 🔍 Without SMTP Configuration

If SMTP is **not configured**, the email content will be **printed to console logs**:

```bash
# View email in logs
sudo docker-compose logs backend | grep -A 50 "Email DEBUG"
```

You'll see:
```
[Email DEBUG] SMTP not configured. Would send email:
From: info@hremsoftconsulting.com
To: user@example.com
Subject: Welcome to Healthcare API Documentation! 🎉
<html>...full email content...</html>
```

**Registration still works!** Users can login immediately, they just won't get the email.

---

## 📧 Email Template

### Subject
```
Welcome to Healthcare API Documentation! 🎉
```

### Content Preview
```
Hi John Doe,

Thank you for registering! Your account has been successfully created.

Account Details:
Email: john@example.com
Company: Example Healthcare Inc
Role: Documentation User

[Sign In Now] (button)

What's Next?
1. Login with your credentials
2. Your API key will be automatically generated
3. Browse the complete API documentation
4. Start integrating with our Healthcare API

Quick Links:
• Login: https://api.hremsoftconsulting.com/docs-website/login
• Documentation: https://api.hremsoftconsulting.com/docs-website/getting-started
• API Reference: https://api.hremsoftconsulting.com/docs
```

---

## 🧪 Testing Email

### Test 1: Register and Check Inbox
1. Register at `/docs-website/register`
2. Check email inbox (including spam folder)
3. Should receive welcome email within 1 minute

### Test 2: Check Logs (If No Email)
```bash
# View recent logs
sudo docker-compose logs backend | tail -100

# Look for:
# [Email DEBUG] SMTP not configured
# OR
# Successfully sent email to user@example.com
```

### Test 3: Test SMTP Directly
```bash
# Connect to backend container
sudo docker exec -it healthcare_backend bash

# Test SMTP from Python
python3 << 'EOF'
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('your-email@gmail.com', 'your-app-password')
print("✅ SMTP connection successful!")
server.quit()
EOF
```

---

## 🔒 Security Best Practices

### Gmail App Passwords
1. ✅ Never use your actual Gmail password
2. ✅ Use app-specific passwords
3. ✅ Enable 2-factor authentication first
4. ✅ Revoke app password if compromised

### Environment Variables
1. ✅ Never commit SMTP credentials to git
2. ✅ Use environment variables
3. ✅ Rotate passwords periodically
4. ✅ Use different credentials per environment

### Email Rate Limits
- Gmail: 500 emails/day (free), 2000/day (workspace)
- SendGrid: 100 emails/day (free), unlimited (paid)
- AWS SES: $0.10 per 1000 emails

---

## 🐛 Troubleshooting

### Issue: "SMTP not configured" in logs
**Solution:** Add SMTP environment variables to docker-compose.yml

### Issue: "Authentication failed"
**Solution:** 
- Gmail: Use app password, not regular password
- Enable "Less secure app access" or use OAuth2

### Issue: Emails go to spam
**Solution:**
- Configure SPF, DKIM, DMARC records
- Use verified domain email
- SendGrid/AWS SES have better deliverability

### Issue: "Connection timeout"
**Solution:**
- Check firewall allows port 587
- Try port 465 (SSL) instead
- Verify SMTP host is correct

---

## 📊 Current Status

### With SMTP Configured:
- ✅ Welcome emails sent automatically
- ✅ Professional HTML formatting
- ✅ One-click login link
- ✅ Account details included

### Without SMTP:
- ✅ Registration still works
- ✅ Email content logged to console
- ✅ Users can login immediately
- ⚠️ No email delivered to inbox

---

## 🎯 Recommended Setup

**For Production:**
- Use SendGrid or AWS SES (better deliverability)
- Configure SPF/DKIM records
- Use branded email address (e.g., noreply@hremsoftconsulting.com)
- Monitor bounce rates

**For Testing:**
- Gmail app password works fine
- Quick to set up
- No additional cost
- Good for low volume

---

## 🚀 Quick Start (Gmail)

**1. Get App Password from Google**

**2. Edit docker-compose.yml:**
```yaml
backend:
  environment:
    - SMTP_HOST=smtp.gmail.com
    - SMTP_PORT=587
    - SMTP_USER=youremail@gmail.com
    - SMTP_PASSWORD=your-16-char-app-password
    - MAIL_FROM=info@hremsoftconsulting.com
```

**3. Restart:**
```bash
sudo docker-compose restart backend
```

**4. Test:**
Register at `/docs-website/register` and check email!

---

## ✅ Summary

- ✅ Welcome emails implemented
- ✅ Beautiful HTML template
- ✅ Uses existing emailer.py utility
- ✅ Graceful fallback if SMTP not configured
- ✅ Registration works with or without email
- ✅ Professional branding
- ✅ One-click login link

**All changes pushed to GitHub!**

Configure SMTP on your server to enable email delivery, or leave it as-is and emails will just be logged (registration still works fine).

