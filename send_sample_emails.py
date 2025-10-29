"""
Send sample emails to admin for review
"""
import sys
sys.path.append('/app/backend')

from email_service import get_email_service
from email_templates import (
    vendor_invitation_email,
    vendor_invoice_submitted_email,
    vendor_invoice_approved_email,
    vendor_invoice_rejected_email,
    vendor_payment_approved_email,
    vendor_remittance_advice_email,
    vendor_document_status_email,
    employee_paystub_available_email,
    employee_payment_processed_email,
    employee_assignment_notification,
    schedule_change_notification
)

# Initialize email service
email_service = get_email_service()

# Target email
admin_email = "admin@williamsdiverse.com"

print("Sending sample emails to", admin_email)
print("=" * 60)

# 1. Vendor Invitation
print("\n1. Sending Vendor Invitation sample...")
email_data = vendor_invitation_email(
    vendor_name="ACME Construction LLC",
    invitation_code="ABC12345",
    portal_url="https://williams-portal.preview.emergentagent.com/auth?code=ABC12345&type=vendor"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 2. Vendor Invoice Submitted
print("\n2. Sending Invoice Submitted sample...")
email_data = vendor_invoice_submitted_email(
    vendor_name="ACME Construction LLC",
    invoice_number="INV-2025-001",
    amount="15,750.00",
    portal_url="https://williams-portal.preview.emergentagent.com/vendors"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 3. Vendor Invoice Approved
print("\n3. Sending Invoice Approved sample...")
email_data = vendor_invoice_approved_email(
    vendor_name="ACME Construction LLC",
    invoice_number="INV-2025-001",
    amount="15,750.00",
    payment_date="November 15, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/vendors"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 4. Vendor Invoice Rejected
print("\n4. Sending Invoice Rejected sample...")
email_data = vendor_invoice_rejected_email(
    vendor_name="ACME Construction LLC",
    invoice_number="INV-2025-002",
    amount="8,500.00",
    reason="Invoice date does not match purchase order. Please verify and resubmit with correct date.",
    portal_url="https://williams-portal.preview.emergentagent.com/vendors"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 5. Vendor Payment Approved (Pre-notification)
print("\n5. Sending Payment Approved sample...")
email_data = vendor_payment_approved_email(
    vendor_name="ACME Construction LLC",
    invoice_numbers=["INV-2025-001", "INV-2025-003"],
    total_amount="23,450.00",
    payment_method="ACH Direct Deposit",
    expected_date="November 17, 2025"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 6. Vendor Remittance Advice (Payment Processed)
print("\n6. Sending Remittance Advice sample...")
email_data = vendor_remittance_advice_email(
    vendor_name="ACME Construction LLC",
    invoice_numbers=["INV-2025-001", "INV-2025-003"],
    total_amount="23,450.00",
    payment_method="ACH Direct Deposit",
    payment_date="November 15, 2025",
    transaction_ref="TXN-2025-11-15-001234"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 7. Document Approved
print("\n7. Sending Document Approved sample...")
email_data = vendor_document_status_email(
    vendor_name="ACME Construction LLC",
    document_type="Certificate of Insurance (COI)",
    status="approved"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 8. Document Rejected
print("\n8. Sending Document Rejected sample...")
email_data = vendor_document_status_email(
    vendor_name="ACME Construction LLC",
    document_type="W-9 Form",
    status="rejected",
    reason="Signature is missing. Please sign the form and resubmit."
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 9. Document Expiring Soon
print("\n9. Sending Document Expiring sample...")
email_data = vendor_document_status_email(
    vendor_name="ACME Construction LLC",
    document_type="Certificate of Insurance (COI)",
    status="expiring",
    expiry_days=15
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 10. Employee Paystub Available
print("\n10. Sending Employee Paystub Available sample...")
email_data = employee_paystub_available_email(
    employee_name="John Smith",
    pay_period="10/16/2025 - 10/31/2025",
    gross_amount="3,200.00",
    net_amount="2,485.50",
    pay_date="November 5, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/my-payroll-documents"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 11. Employee Payment Processed
print("\n11. Sending Employee Payment Processed sample...")
email_data = employee_payment_processed_email(
    employee_name="John Smith",
    amount="2,485.50",
    pay_date="November 5, 2025",
    account_last4="4567"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 12. Employee Task Assignment
print("\n12. Sending Task Assignment sample...")
email_data = employee_assignment_notification(
    employee_name="John Smith",
    item_type="Task",
    item_title="Install electrical wiring - Building A",
    assigned_by="Nalen Williams",
    due_date="November 20, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/tasks"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 13. Employee Project Assignment
print("\n13. Sending Project Assignment sample...")
email_data = employee_assignment_notification(
    employee_name="John Smith",
    item_type="Project",
    item_title="Downtown Office Renovation - Phase 2",
    assigned_by="Nalen Williams",
    due_date="December 15, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/projects"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 14. Employee Work Order Assignment
print("\n14. Sending Work Order Assignment sample...")
email_data = employee_assignment_notification(
    employee_name="John Smith",
    item_type="Work Order",
    item_title="Emergency HVAC Repair - Suite 200",
    assigned_by="Nalen Williams",
    due_date="November 10, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/work-orders"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

# 15. Schedule Change
print("\n15. Sending Schedule Change sample...")
email_data = schedule_change_notification(
    user_name="John Smith",
    change_type="Shift Time",
    old_value="Monday 8:00 AM - 5:00 PM",
    new_value="Monday 7:00 AM - 4:00 PM",
    changed_by="Nalen Williams"
)
result = email_service.send_email(admin_email, email_data["subject"], email_data["html"], html=True)
print(f"   {'✓ Sent' if result else '✗ Failed'}: {email_data['subject']}")

print("\n" + "=" * 60)
print("✅ All sample emails sent!")
print(f"Check inbox: {admin_email}")
print("=" * 60)
