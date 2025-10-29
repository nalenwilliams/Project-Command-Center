"""
Generate HTML samples of all email templates with fixed logo
"""
import os
import sys
sys.path.append('/app/backend')

from email_templates import (
    vendor_account_created_email,
    vendor_invitation_email,
    vendor_invoice_submitted_email,
    vendor_document_status_email,
    employee_paystub_available_email,
    employee_payment_processed_email,
    employee_assignment_notification
)

# Create output directory
output_dir = "/app/email_samples"
os.makedirs(output_dir, exist_ok=True)

# Sample data for generating emails
samples = [
    {
        "name": "01_vendor_account_created",
        "template": vendor_account_created_email(
            vendor_name="ABC Construction LLC",
            contact_name="John Smith",
            email="john@abcconstruction.com",
            temp_password="TempPass123!",
            portal_url="https://crm-command-1.preview.emergentagent.com/auth"
        )
    },
    {
        "name": "02_vendor_invitation",
        "template": vendor_invitation_email(
            vendor_name="XYZ Contractors",
            invitation_code="ABC12345",
            portal_url="https://crm-command-1.preview.emergentagent.com/vendor-onboarding?code=ABC12345"
        )
    },
    {
        "name": "03_vendor_invoice_submitted",
        "template": vendor_invoice_submitted_email(
            vendor_name="ABC Construction LLC",
            invoice_number="INV-2025-001",
            amount="15,000.00",
            portal_url="https://crm-command-1.preview.emergentagent.com/vendors"
        )
    },
    {
        "name": "04_vendor_document_approved",
        "template": vendor_document_status_email(
            vendor_name="ABC Construction LLC",
            document_type="Certificate of Insurance",
            status="Approved",
            reason="All documents verified and approved."
        )
    },
    {
        "name": "05_employee_paystub",
        "template": employee_paystub_available_email(
            employee_name="Sarah Johnson",
            pay_period="01/01/2025 - 01/15/2025",
            gross_amount="3,200.00",
            net_amount="2,450.00",
            pay_date="01/15/2025",
            portal_url="https://crm-command-1.preview.emergentagent.com/my-payroll-documents"
        )
    },
    {
        "name": "06_employee_payment",
        "template": employee_payment_processed_email(
            employee_name="Sarah Johnson",
            amount="2,450.00",
            pay_date="01/15/2025",
            account_last4="1234"
        )
    },
    {
        "name": "07_assignment_notification",
        "template": employee_assignment_notification(
            employee_name="John Smith",
            item_type="Project",
            item_title="Downtown Office Renovation",
            assigned_by="Admin User",
            due_date="02/01/2025",
            portal_url="https://crm-command-1.preview.emergentagent.com/projects"
        )
    }
]

# Generate HTML files
print("=" * 70)
print("Generating Email Template Samples with Fixed Logo")
print("=" * 70)

for sample in samples:
    filename = f"{output_dir}/{sample['name']}.html"
    with open(filename, 'w') as f:
        f.write(sample['template']['html'])
    print(f"✅ Generated: {sample['name']}.html")
    print(f"   Subject: {sample['template']['subject']}")

print("\n" + "=" * 70)
print(f"✅ All email samples saved to: {output_dir}/")
print("=" * 70)
print("\n📋 Files created:")
for sample in samples:
    print(f"   - {sample['name']}.html")

print("\n💡 To view these emails:")
print(f"   1. Navigate to {output_dir}/")
print("   2. Open any .html file in your browser")
print("   3. Logo should now display correctly!")
print("=" * 70)
