"""
Generate HTML files for all email templates for preview
"""
import sys
sys.path.append('/app/backend')

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
from pathlib import Path

# Create output directory
output_dir = Path('/app/frontend/public/email_samples')
output_dir.mkdir(exist_ok=True)

print("Generating email sample HTML files...")
print("=" * 60)

samples = []

# 1. Vendor Invitation
email_data = vendor_invitation_email(
    vendor_name="ACME Construction LLC",
    invitation_code="ABC12345",
    portal_url="https://williams-portal.preview.emergentagent.com/auth?code=ABC12345&type=vendor"
)
filename = "01_vendor_invitation.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Vendor Invitation", filename))
print(f"✓ Generated: {filename}")

# 2. Vendor Invoice Submitted
email_data = vendor_invoice_submitted_email(
    vendor_name="ACME Construction LLC",
    invoice_number="INV-2025-001",
    amount="15,750.00",
    portal_url="https://williams-portal.preview.emergentagent.com/vendors"
)
filename = "02_vendor_invoice_submitted.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Invoice Submitted", filename))
print(f"✓ Generated: {filename}")

# 3. Vendor Invoice Approved
email_data = vendor_invoice_approved_email(
    vendor_name="ACME Construction LLC",
    invoice_number="INV-2025-001",
    amount="15,750.00",
    payment_date="November 15, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/vendors"
)
filename = "03_vendor_invoice_approved.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Invoice Approved", filename))
print(f"✓ Generated: {filename}")

# 4. Vendor Invoice Rejected
email_data = vendor_invoice_rejected_email(
    vendor_name="ACME Construction LLC",
    invoice_number="INV-2025-002",
    amount="8,500.00",
    reason="Invoice date does not match purchase order. Please verify and resubmit with correct date.",
    portal_url="https://williams-portal.preview.emergentagent.com/vendors"
)
filename = "04_vendor_invoice_rejected.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Invoice Rejected", filename))
print(f"✓ Generated: {filename}")

# 5. Vendor Payment Approved
email_data = vendor_payment_approved_email(
    vendor_name="ACME Construction LLC",
    invoice_numbers=["INV-2025-001", "INV-2025-003"],
    total_amount="23,450.00",
    payment_method="ACH Direct Deposit",
    expected_date="November 17, 2025"
)
filename = "05_vendor_payment_approved.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Payment Approved", filename))
print(f"✓ Generated: {filename}")

# 6. Vendor Remittance Advice
email_data = vendor_remittance_advice_email(
    vendor_name="ACME Construction LLC",
    invoice_numbers=["INV-2025-001", "INV-2025-003"],
    total_amount="23,450.00",
    payment_method="ACH Direct Deposit",
    payment_date="November 15, 2025",
    transaction_ref="TXN-2025-11-15-001234"
)
filename = "06_vendor_remittance_advice.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Remittance Advice", filename))
print(f"✓ Generated: {filename}")

# 7. Document Approved
email_data = vendor_document_status_email(
    vendor_name="ACME Construction LLC",
    document_type="Certificate of Insurance (COI)",
    status="approved"
)
filename = "07_document_approved.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Document Approved", filename))
print(f"✓ Generated: {filename}")

# 8. Document Rejected
email_data = vendor_document_status_email(
    vendor_name="ACME Construction LLC",
    document_type="W-9 Form",
    status="rejected",
    reason="Signature is missing. Please sign the form and resubmit."
)
filename = "08_document_rejected.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Document Rejected", filename))
print(f"✓ Generated: {filename}")

# 9. Document Expiring
email_data = vendor_document_status_email(
    vendor_name="ACME Construction LLC",
    document_type="Certificate of Insurance (COI)",
    status="expiring",
    expiry_days=15
)
filename = "09_document_expiring.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Document Expiring", filename))
print(f"✓ Generated: {filename}")

# 10. Employee Paystub Available
email_data = employee_paystub_available_email(
    employee_name="John Smith",
    pay_period="10/16/2025 - 10/31/2025",
    gross_amount="3,200.00",
    net_amount="2,485.50",
    pay_date="November 5, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/my-payroll-documents"
)
filename = "10_employee_paystub_available.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Paystub Available", filename))
print(f"✓ Generated: {filename}")

# 11. Employee Payment Processed
email_data = employee_payment_processed_email(
    employee_name="John Smith",
    amount="2,485.50",
    pay_date="November 5, 2025",
    account_last4="4567"
)
filename = "11_employee_payment_processed.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Payment Deposited", filename))
print(f"✓ Generated: {filename}")

# 12. Task Assignment
email_data = employee_assignment_notification(
    employee_name="John Smith",
    item_type="Task",
    item_title="Install electrical wiring - Building A",
    assigned_by="Nalen Williams",
    due_date="November 20, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/tasks"
)
filename = "12_task_assignment.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Task Assignment", filename))
print(f"✓ Generated: {filename}")

# 13. Project Assignment
email_data = employee_assignment_notification(
    employee_name="John Smith",
    item_type="Project",
    item_title="Downtown Office Renovation - Phase 2",
    assigned_by="Nalen Williams",
    due_date="December 15, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/projects"
)
filename = "13_project_assignment.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Project Assignment", filename))
print(f"✓ Generated: {filename}")

# 14. Work Order Assignment
email_data = employee_assignment_notification(
    employee_name="John Smith",
    item_type="Work Order",
    item_title="Emergency HVAC Repair - Suite 200",
    assigned_by="Nalen Williams",
    due_date="November 10, 2025",
    portal_url="https://williams-portal.preview.emergentagent.com/work-orders"
)
filename = "14_work_order_assignment.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Work Order Assignment", filename))
print(f"✓ Generated: {filename}")

# 15. Schedule Change
email_data = schedule_change_notification(
    user_name="John Smith",
    change_type="Shift Time",
    old_value="Monday 8:00 AM - 5:00 PM",
    new_value="Monday 7:00 AM - 4:00 PM",
    changed_by="Nalen Williams"
)
filename = "15_schedule_change.html"
(output_dir / filename).write_text(email_data["html"])
samples.append(("Schedule Change", filename))
print(f"✓ Generated: {filename}")

# Create index page
index_html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template Samples - Williams Diversified LLC</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #000;
            color: #fff;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #C9A961;
            text-align: center;
            margin-bottom: 10px;
        }
        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 40px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .card {
            background-color: #1a1a1a;
            border: 2px solid #C9A961;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s;
        }
        .card:hover {
            transform: translateY(-5px);
            border-color: #f0d78c;
        }
        .card h3 {
            color: #C9A961;
            margin-top: 0;
        }
        .card a {
            display: inline-block;
            background-color: #C9A961;
            color: #000;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 10px;
        }
        .card a:hover {
            background-color: #f0d78c;
        }
        .section {
            margin-top: 40px;
        }
        .section h2 {
            color: #C9A961;
            border-bottom: 2px solid #C9A961;
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>📧 Email Template Samples</h1>
    <p class="subtitle">Williams Diversified LLC - Branded Notification System</p>
    
    <div class="section">
        <h2>Vendor Email Templates</h2>
        <div class="grid">
"""

for i in range(9):
    name, filename = samples[i]
    index_html += f"""
            <div class="card">
                <h3>{name}</h3>
                <a href="{filename}" target="_blank">View Email</a>
            </div>
"""

index_html += """
        </div>
    </div>
    
    <div class="section">
        <h2>Employee Email Templates</h2>
        <div class="grid">
"""

for i in range(9, 15):
    name, filename = samples[i]
    index_html += f"""
            <div class="card">
                <h3>{name}</h3>
                <a href="{filename}" target="_blank">View Email</a>
            </div>
"""

index_html += """
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 60px; padding-top: 20px; border-top: 2px solid #C9A961;">
        <p style="color: #888;">All email templates feature Williams Diversified LLC branding</p>
        <p style="color: #C9A961; font-weight: bold;">Gold (#C9A961) & Black (#000000) Theme</p>
    </div>
</body>
</html>
"""

(output_dir / "index.html").write_text(index_html)
print(f"✓ Generated: index.html")

print("\n" + "=" * 60)
print("✅ All email samples generated!")
print(f"\n📂 Location: /app/frontend/public/email_samples/")
print(f"🌐 View online at: https://williams-portal.preview.emergentagent.com/email_samples/")
print("=" * 60)
