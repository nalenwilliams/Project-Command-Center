# SMTP Email Configuration Guide

## 🎯 Current Status

✅ **Email Notification System:** Fully implemented and working
✅ **Backend Integration:** All assignment notifications configured  
✅ **Email Templates:** 15 branded templates created
⚠️ **SMTP Configuration:** NOT YET CONFIGURED (emails won't send until this is done)

---

## 📧 How to Enable Email Sending

The email notification system is ready but needs SMTP server credentials to actually send emails.

### Step 1: Get SMTP Credentials

You can use any email service provider:

**Option 1: Gmail** (Recommended for testing)
- SMTP Server: `smtp.gmail.com`
- SMTP Port: `587`
- Username: Your Gmail address
- Password: App-specific password (not your regular password)
- How to get app password: https://support.google.com/accounts/answer/185833

**Option 2: SendGrid** (Recommended for production)
- SMTP Server: `smtp.sendgrid.net`
- SMTP Port: `587`
- Username: `apikey`
- Password: Your SendGrid API key
- Sign up: https://sendgrid.com

**Option 3: Other providers**
- Office 365, Mailgun, AWS SES, etc.

### Step 2: Add SMTP Settings to Backend

Edit `/app/backend/.env` and add these lines:

```bash
# SMTP Email Configuration
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM_EMAIL="noreply@williamsdiverse.com"
```

### Step 3: Restart Backend

```bash
sudo supervisorctl restart backend
```

---

## 🧪 Test Email Sending

After configuring SMTP, test by:

1. Login as admin
2. Go to Tasks page
3. Create a new task and assign it to an employee or vendor
4. The assigned user should receive an email notification

---

## ✉️ Email Notifications That Will Send Automatically

### When Tasks Are Assigned:
- Employee receives: Work assignment email with task details, due date, priority
- Vendor receives: Same, with vendor-specific template

### When Projects Are Assigned:
- Employee receives: Project assignment with description, start/end dates
- Vendor receives: Same, with vendor-specific template

### When Work Orders Are Assigned:
- Employee receives: Work order assignment with location, start date
- Vendor receives: Same, with vendor-specific template

### Other Notifications (Already Configured):
- Vendor account created (with password)
- Invoice status updates
- Payment notifications (remittance advice)
- Document approvals
- Paystub availability (employees)
- Payment confirmations (employees)

---

## 🔍 Troubleshooting

### Emails Not Sending?

1. **Check backend logs:**
   ```bash
   tail -f /var/log/supervisor/backend.err.log
   ```

2. **Verify SMTP settings are correct**
   - Test credentials with your email provider
   - Check if firewall blocks port 587

3. **Check for error messages:**
   ```bash
   grep -i "email" /var/log/supervisor/backend.err.log
   ```

### Common Issues:

**"Email service not configured"**
- SMTP settings missing from .env file
- Add SMTP credentials and restart backend

**"Authentication failed"**
- Wrong password or username
- For Gmail: Use app-specific password, not regular password

**"Connection timeout"**
- Firewall blocking SMTP port
- Try port 465 (SSL) instead of 587 (TLS)

---

## 📋 Current Configuration Status

```
✅ Email Templates: 15 professional templates created
✅ Backend Logic: Automatic sending on assignments configured
✅ Role Detection: Automatically sends employee or vendor version
✅ Template Gallery: https://williams-portal.preview.emergentagent.com/email_samples/
⚠️ SMTP Setup: Requires your credentials to send actual emails
```

---

## 💡 Next Steps

1. **Add SMTP credentials** to `/app/backend/.env`
2. **Restart backend:** `sudo supervisorctl restart backend`
3. **Test by assigning a task** to an employee or vendor
4. **Check email inbox** for the notification

Once SMTP is configured, all email notifications will work automatically!
