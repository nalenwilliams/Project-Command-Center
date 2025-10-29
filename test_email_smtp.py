#!/usr/bin/env python3
"""
Test SMTP Email Configuration
"""
import sys
import os
sys.path.insert(0, '/app/backend')

# Load .env file manually
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from email_service import get_email_service
from email_templates import employee_task_assignment

print("=" * 70)
print("Testing SMTP Email Configuration")
print("=" * 70)

# Initialize email service with explicit values
email_service = get_email_service(
    smtp_server=os.getenv('SMTP_SERVER'),
    smtp_port=int(os.getenv('SMTP_PORT', 587)),
    username=os.getenv('SMTP_USERNAME'),
    password=os.getenv('SMTP_PASSWORD'),
    from_email=os.getenv('SMTP_FROM_EMAIL')
)

print(f"\n📧 SMTP Configuration:")
print(f"   Server: {email_service.smtp_server}")
print(f"   Port: {email_service.smtp_port}")
print(f"   Username: {email_service.username}")
print(f"   From Email: {email_service.from_email}")
print(f"   Enabled: {email_service.enabled}")

if not email_service.enabled:
    print("\n❌ Email service is NOT configured properly!")
    sys.exit(1)

print("\n✅ Email service is configured!")
print("\n🧪 Sending test email...")

# Generate test email
test_email_data = employee_task_assignment(
    employee_name="Test User",
    task_title="Test Task - SMTP Configuration Check",
    task_description="This is a test email to verify that your SMTP configuration is working correctly.",
    due_date="January 31, 2025",
    priority="High",
    assigned_by="System Administrator",
    portal_url="https://williams-portal.preview.emergentagent.com/tasks"
)

# Send test email to admin
try:
    result = email_service.send_email(
        to_email="admin@williamsdiverse.com",
        subject=test_email_data['subject'] + " [TEST]",
        body=test_email_data['html']
    )
    
    if result:
        print("✅ TEST EMAIL SENT SUCCESSFULLY!")
        print(f"\n📬 Check your inbox: admin@williamsdiverse.com")
        print("   Subject: New Task Assignment: Test Task - SMTP Configuration Check [TEST]")
        print("\nIf you don't see it:")
        print("   1. Check your spam/junk folder")
        print("   2. Wait a minute or two")
        print("   3. Check the email address is correct")
    else:
        print("❌ Failed to send test email!")
        print("   Check the backend logs for details")
        
except Exception as e:
    print(f"❌ Error sending test email: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
