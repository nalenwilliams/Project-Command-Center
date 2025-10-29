#!/usr/bin/env python3
"""
Generate comprehensive email samples for all notification templates
"""
import os
import sys
sys.path.insert(0, '/app/backend')

from email_templates import (
    vendor_account_created_email,
    vendor_invitation_email,
    vendor_invoice_submitted_email,
    vendor_invoice_approved_email,
    vendor_payment_approved_email,
    vendor_remittance_advice_email,
    vendor_document_status_email,
    vendor_work_order_assignment,
    vendor_project_assignment,
    vendor_task_assignment,
    employee_paystub_available_email,
    employee_payment_processed_email,
    employee_work_order_assignment,
    employee_project_assignment,
    employee_task_assignment
)

# Output directory
output_dir = "/app/email_samples"
os.makedirs(output_dir, exist_ok=True)

# Sample data
portal_url = "https://williams-portal.preview.emergentagent.com"

# Email template data
emails = []

print("=" * 70)
print("Generating All Email Template Samples")
print("=" * 70)

# Vendor Emails
emails.append({
    "filename": "01_vendor_account_created.html",
    "template": vendor_account_created_email(
        vendor_name="ABC Construction Inc",
        contact_name="Robert Smith",
        email="vendor@abcconstruction.com",
        temp_password="Welcome2024!",
        portal_url=portal_url
    )
})

emails.append({
    "filename": "02_vendor_invitation.html",
    "template": vendor_invitation_email(
        vendor_name="XYZ Services LLC",
        invitation_code="VENDOR2024XYZ",
        portal_url=portal_url
    )
})

emails.append({
    "filename": "03_vendor_invoice_submitted.html",
    "template": vendor_invoice_submitted_email(
        vendor_name="ABC Construction Inc",
        invoice_number="INV-2025-001",
        amount="15,750.00",
        portal_url=f"{portal_url}/invoices"
    )
})

emails.append({
    "filename": "04_vendor_invoice_approved.html",
    "template": vendor_invoice_approved_email(
        vendor_name="ABC Construction Inc",
        invoice_number="INV-2025-001",
        amount="15,750.00",
        payment_date="January 25, 2025",
        portal_url=f"{portal_url}/invoices"
    )
})

emails.append({
    "filename": "05_vendor_payment_approved.html",
    "template": vendor_payment_approved_email(
        vendor_name="ABC Construction Inc",
        invoice_numbers=["INV-2025-001", "INV-2025-002"],
        total_amount="25,500.00",
        payment_method="ACH Direct Deposit",
        expected_date="January 30, 2025"
    )
})

emails.append({
    "filename": "06_vendor_remittance_advice.html",
    "template": vendor_remittance_advice_email(
        vendor_name="ABC Construction Inc",
        invoice_numbers=["INV-2025-001", "INV-2025-002"],
        total_amount="25,500.00",
        payment_method="ACH Direct Deposit",
        payment_date="January 30, 2025",
        transaction_ref="TXN-20250130-ABC123"
    )
})

emails.append({
    "filename": "07_vendor_document_approved.html",
    "template": vendor_document_status_email(
        vendor_name="ABC Construction Inc",
        document_type="Certificate of Insurance",
        status="approved"
    )
})

emails.append({
    "filename": "08_vendor_work_order_assignment.html",
    "template": vendor_work_order_assignment(
        vendor_name="ABC Construction Inc",
        work_order_number="WO-2025-015",
        work_order_title="Electrical Panel Installation",
        assigned_by="John Williams",
        start_date="February 1, 2025",
        location="123 Main Street, Springfield, IL",
        portal_url=f"{portal_url}/work-orders"
    )
})

emails.append({
    "filename": "09_vendor_project_assignment.html",
    "template": vendor_project_assignment(
        vendor_name="ABC Construction Inc",
        project_name="Downtown Office Renovation",
        project_description="Complete renovation of 5th floor office space including electrical, plumbing, and HVAC upgrades",
        assigned_by="John Williams",
        start_date="February 15, 2025",
        end_date="April 30, 2025",
        portal_url=f"{portal_url}/projects"
    )
})

emails.append({
    "filename": "10_vendor_task_assignment.html",
    "template": vendor_task_assignment(
        vendor_name="ABC Construction Inc",
        task_title="Submit Material Procurement List",
        task_description="Prepare and submit a detailed list of all materials required for the electrical panel installation project",
        assigned_by="John Williams",
        due_date="January 28, 2025",
        priority="High",
        portal_url=f"{portal_url}/tasks"
    )
})

# Employee Emails
emails.append({
    "filename": "11_employee_paystub.html",
    "template": employee_paystub_email(
        employee_name="Sarah Johnson",
        pay_period="January 1, 2025 - January 15, 2025",
        gross_amount="3,200.00",
        net_amount="2,450.00",
        pay_date="January 20, 2025",
        portal_url=f"{portal_url}/payroll"
    )
})

emails.append({
    "filename": "12_employee_payment.html",
    "template": employee_payment_email(
        employee_name="Sarah Johnson",
        amount="2,450.00",
        pay_date="January 20, 2025",
        payment_method="Direct Deposit",
        bank_account="****5678"
    )
})

emails.append({
    "filename": "13_employee_work_order_assignment.html",
    "template": employee_work_order_assignment(
        employee_name="Mike Rodriguez",
        work_order_number="WO-2025-020",
        work_order_title="Safety Inspection - Construction Site A",
        assigned_by="John Williams",
        start_date="February 5, 2025",
        location="456 Industrial Parkway, Springfield, IL",
        portal_url=f"{portal_url}/work-orders"
    )
})

emails.append({
    "filename": "14_employee_project_assignment.html",
    "template": employee_project_assignment(
        employee_name="Mike Rodriguez",
        project_name="Highway Bridge Repair - Route 66",
        project_description="Structural assessment and repair of bridge supports, including concrete reinforcement and weatherproofing",
        assigned_by="John Williams",
        start_date="March 1, 2025",
        end_date="June 15, 2025",
        portal_url=f"{portal_url}/projects"
    )
})

emails.append({
    "filename": "15_employee_task_assignment.html",
    "template": employee_task_assignment(
        employee_name="Mike Rodriguez",
        task_title="Complete Safety Training Certification",
        task_description="Complete the annual OSHA safety training and upload certification to the portal",
        due_date="February 10, 2025",
        priority="High",
        assigned_by="John Williams",
        portal_url=f"{portal_url}/tasks"
    )
})

# Generate HTML files
for email_data in emails:
    filename = email_data["filename"]
    template = email_data["template"]
    
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'w') as f:
        f.write(template['html'])
    
    print(f"✅ Generated: {filename}")
    print(f"   Subject: {template['subject']}")

# Create index.html
index_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Williams Diversified LLC - Email Templates Gallery</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #000;
            color: #C9A961;
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
            color: #C9A961;
        }
        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 40px;
            font-size: 1.1em;
        }
        .section {
            margin-bottom: 50px;
        }
        .section h2 {
            color: #C9A961;
            border-bottom: 2px solid #C9A961;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .card {
            background: #1a1a1a;
            border: 2px solid #C9A961;
            border-radius: 8px;
            padding: 20px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(201, 169, 97, 0.3);
        }
        .card h3 {
            color: #C9A961;
            margin-bottom: 10px;
            font-size: 1.2em;
        }
        .card p {
            color: #888;
            margin-bottom: 15px;
            font-size: 0.9em;
        }
        .card a {
            display: inline-block;
            background: #C9A961;
            color: #000;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            transition: background 0.2s;
        }
        .card a:hover {
            background: #E0C080;
        }
        .stats {
            text-align: center;
            background: #1a1a1a;
            border: 2px solid #C9A961;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 40px;
        }
        .stats h3 {
            color: #C9A961;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 Williams Diversified LLC</h1>
        <p class="subtitle">Email Templates Gallery - Complete Notification System</p>
        
        <div class="stats">
            <h3>15 Professional Email Templates</h3>
            <p style="color: #888;">All templates include Williams Diversified LLC branding with embedded logo</p>
        </div>

        <div class="section">
            <h2>📦 Vendor Notifications (10 Templates)</h2>
            <div class="grid">
"""

# Vendor email cards
vendor_emails = [
    ("01_vendor_account_created.html", "Account Created", "New vendor account with login credentials"),
    ("02_vendor_invitation.html", "Vendor Invitation", "Invitation code for portal registration"),
    ("03_vendor_invoice_submitted.html", "Invoice Submitted", "Confirmation of invoice submission"),
    ("04_vendor_invoice_approved.html", "Invoice Approved", "Invoice approved for payment"),
    ("05_vendor_payment_approved.html", "Payment Approved", "Payment approved and scheduled"),
    ("06_vendor_remittance_advice.html", "Remittance Advice", "Payment processed confirmation"),
    ("07_vendor_document_approved.html", "Document Status", "Document approval notification"),
    ("08_vendor_work_order_assignment.html", "Work Order Assignment", "Assigned to new work order"),
    ("09_vendor_project_assignment.html", "Project Assignment", "Assigned to new project"),
    ("10_vendor_task_assignment.html", "Task Assignment", "Assigned a new task"),
]

for filename, title, description in vendor_emails:
    index_html += f"""
                <div class="card">
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <a href="{filename}" target="_blank">View Template</a>
                </div>
"""

index_html += """
            </div>
        </div>

        <div class="section">
            <h2>👥 Employee Notifications (5 Templates)</h2>
            <div class="grid">
"""

# Employee email cards
employee_emails = [
    ("11_employee_paystub.html", "Paystub Available", "New paystub ready for viewing"),
    ("12_employee_payment.html", "Payment Processed", "Direct deposit payment confirmation"),
    ("13_employee_work_order_assignment.html", "Work Order Assignment", "Assigned to new work order"),
    ("14_employee_project_assignment.html", "Project Assignment", "Assigned to new project"),
    ("15_employee_task_assignment.html", "Task Assignment", "Assigned a new task"),
]

for filename, title, description in employee_emails:
    index_html += f"""
                <div class="card">
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <a href="{filename}" target="_blank">View Template</a>
                </div>
"""

index_html += """
            </div>
        </div>

        <div class="stats">
            <p style="color: #888; margin-top: 20px;">
                ✅ All templates feature Williams Diversified LLC black & gold branding<br>
                ✅ Embedded logo for consistent display across email clients<br>
                ✅ Mobile-responsive design<br>
                ✅ Professional typography and layout
            </p>
        </div>
    </div>
</body>
</html>
"""

# Write index.html
with open(os.path.join(output_dir, "index.html"), 'w') as f:
    f.write(index_html)

print("\n" + "=" * 70)
print(f"✅ All email samples saved to: {output_dir}/")
print("=" * 70)
print("\n📋 Files created:")
for email_data in emails:
    print(f"   - {email_data['filename']}")
print("   - index.html (gallery page)")

print("\n💡 To view these emails:")
print(f"   Open: {portal_url}/email_samples/index.html")
print("\n" + "=" * 70)
