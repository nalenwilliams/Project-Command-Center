"""
Branded Email Templates for Williams Diversified LLC
All notifications use consistent professional branding
"""

COMPANY_INFO = {
    "name": "Williams Diversified LLC",
    "address": "2021 S. LEWIS AVE., SUITE 760",
    "city_state_zip": "TULSA, OK 74104 USA",
    "phone": "(918)917-3526",
    "email": "accountspayable@williamsdiverse.com",
    "logo_url": "https://crm-command-1.preview.emergentagent.com/williams-logo.png"
}

# Brand colors
COLORS = {
    "primary": "#C9A961",  # Gold
    "background": "#000000",  # Black
    "text": "#FFFFFF",  # White
    "muted": "#888888"  # Gray
}

def get_base_template(content: str) -> str:
    """Base template with Williams Diversified branding"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{COMPANY_INFO['name']}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: {COLORS['background']}; border: 2px solid {COLORS['primary']}; border-radius: 8px; overflow: hidden;">
                        <!-- Header with Logo -->
                        <tr>
                            <td style="padding: 30px; text-align: center; background-color: {COLORS['background']}; border-bottom: 2px solid {COLORS['primary']};">
                                <img src="{COMPANY_INFO['logo_url']}" alt="{COMPANY_INFO['name']}" style="max-width: 200px; height: auto;">
                                <h1 style="color: {COLORS['primary']}; margin: 15px 0 5px 0; font-size: 24px;">{COMPANY_INFO['name']}</h1>
                                <p style="color: {COLORS['muted']}; margin: 0; font-size: 14px;">Project Command Center</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px; color: {COLORS['text']};">
                                {content}
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px; background-color: {COLORS['background']}; border-top: 2px solid {COLORS['primary']}; text-align: center;">
                                <p style="color: {COLORS['primary']}; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                                    {COMPANY_INFO['name']}
                                </p>
                                <p style="color: {COLORS['muted']}; margin: 0; font-size: 12px; line-height: 1.6;">
                                    {COMPANY_INFO['address']}<br>
                                    {COMPANY_INFO['city_state_zip']}<br>
                                    Phone: {COMPANY_INFO['phone']}<br>
                                    Email: {COMPANY_INFO['email']}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

def get_button_html(text: str, url: str) -> str:
    """Branded CTA button"""
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
        <tr>
            <td align="center">
                <a href="{url}" style="display: inline-block; padding: 15px 40px; background-color: {COLORS['primary']}; color: {COLORS['background']}; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    {text}
                </a>
            </td>
        </tr>
    </table>
    """

# ============================================
# VENDOR EMAIL TEMPLATES
# ============================================

def vendor_invitation_email(vendor_name: str, invitation_code: str, portal_url: str) -> dict:
    """Vendor invitation email"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">Vendor Invitation</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        You have been invited to join the Williams Diversified LLC Vendor Portal. 
        This portal will allow you to submit invoices, track payments, and manage your company documents.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border-left: 4px solid {COLORS['primary']}; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: {COLORS['primary']}; font-size: 14px; font-weight: bold;">YOUR INVITATION CODE:</p>
        <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: {COLORS['primary']};">
            {invitation_code}
        </p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Click the button below to create your account and complete your vendor profile:
    </p>
    
    {get_button_html('Create My Account', portal_url)}
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        If you have any questions, please contact our Accounts Payable department at {COMPANY_INFO['email']} or {COMPANY_INFO['phone']}.
    </p>
    """
    return {
        "subject": f"Vendor Invitation - {COMPANY_INFO['name']}",
        "html": get_base_template(content)
    }

def vendor_invoice_submitted_email(vendor_name: str, invoice_number: str, amount: str, portal_url: str) -> dict:
    """Confirmation email when vendor submits invoice"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">Invoice Submitted Successfully</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        We have received your invoice and it is now under review.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 1px solid {COLORS['primary']}; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: {COLORS['primary']}; font-weight: bold;">Invoice Details:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Invoice Number:</strong> {invoice_number}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Amount:</strong> ${amount}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Status:</strong> <span style="color: #FFA500;">Pending Review</span></p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        You will receive another notification when your invoice status changes.
    </p>
    
    {get_button_html('View Invoice', portal_url)}
    """
    return {
        "subject": f"Invoice {invoice_number} Submitted - {COMPANY_INFO['name']}",
        "html": get_base_template(content)
    }

def vendor_invoice_approved_email(vendor_name: str, invoice_number: str, amount: str, payment_date: str, portal_url: str) -> dict:
    """Email when vendor invoice is approved"""
    content = f"""
    <h2 style="color: #4CAF50; margin-top: 0;">✓ Invoice Approved</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        Great news! Your invoice has been approved for payment.
    </p>
    
    <div style="background-color: rgba(76, 175, 80, 0.1); border: 1px solid #4CAF50; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #4CAF50; font-weight: bold;">Approved Invoice:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Invoice Number:</strong> {invoice_number}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Amount:</strong> ${amount}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Expected Payment Date:</strong> {payment_date}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Payment will be processed shortly. You will receive a remittance advice when payment is complete.
    </p>
    
    {get_button_html('View Invoice', portal_url)}
    """
    return {
        "subject": f"Invoice {invoice_number} Approved - Payment Processing",
        "html": get_base_template(content)
    }

def vendor_invoice_rejected_email(vendor_name: str, invoice_number: str, amount: str, reason: str, portal_url: str) -> dict:
    """Email when vendor invoice is rejected"""
    content = f"""
    <h2 style="color: #F44336; margin-top: 0;">Invoice Requires Attention</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        Your invoice requires revision before we can proceed with payment.
    </p>
    
    <div style="background-color: rgba(244, 67, 54, 0.1); border: 1px solid #F44336; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #F44336; font-weight: bold;">Invoice Details:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Invoice Number:</strong> {invoice_number}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Amount:</strong> ${amount}</p>
        <p style="margin: 15px 0 5px 0; color: #F44336; font-weight: bold;">Reason for Rejection:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};">{reason}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Please correct the issue and resubmit your invoice. If you have questions, please contact our Accounts Payable team.
    </p>
    
    {get_button_html('Resubmit Invoice', portal_url)}
    """
    return {
        "subject": f"Action Required: Invoice {invoice_number} Needs Revision",
        "html": get_base_template(content)
    }

def vendor_payment_approved_email(vendor_name: str, invoice_numbers: list, total_amount: str, payment_method: str, expected_date: str) -> dict:
    """Pre-notification that payment has been approved"""
    invoices_html = "".join([f"<li>{inv}</li>" for inv in invoice_numbers])
    
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">Payment Approved - Processing Soon</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        Your payment has been approved and will be processed shortly.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 1px solid {COLORS['primary']}; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: {COLORS['primary']}; font-weight: bold;">Payment Details:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Total Amount:</strong> ${total_amount}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Payment Method:</strong> {payment_method}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Expected Deposit Date:</strong> {expected_date}</p>
        <p style="margin: 15px 0 5px 0; color: {COLORS['primary']}; font-weight: bold;">Invoices Paid:</p>
        <ul style="margin: 5px 0; color: {COLORS['text']};">{invoices_html}</ul>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        You will receive a final remittance advice with transaction details once payment is processed.
    </p>
    """
    return {
        "subject": f"Payment Approved - ${total_amount} - {COMPANY_INFO['name']}",
        "html": get_base_template(content)
    }

def vendor_remittance_advice_email(vendor_name: str, invoice_numbers: list, total_amount: str, payment_method: str, payment_date: str, transaction_ref: str) -> dict:
    """Final remittance advice when payment is processed"""
    invoices_html = "".join([f"<li>{inv}</li>" for inv in invoice_numbers])
    
    content = f"""
    <h2 style="color: #4CAF50; margin-top: 0;">✓ Payment Processed - Remittance Advice</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        Your payment has been successfully processed.
    </p>
    
    <div style="background-color: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; border-radius: 5px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 15px 0; color: #4CAF50; font-weight: bold; font-size: 18px;">Payment Confirmation</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Payment Amount:</strong> <span style="color: #4CAF50; font-size: 20px;">${total_amount}</span></p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Payment Date:</strong> {payment_date}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Payment Method:</strong> {payment_method}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Transaction Reference:</strong> {transaction_ref}</p>
        <p style="margin: 15px 0 5px 0; color: {COLORS['text']}; font-weight: bold;">Invoices Paid:</p>
        <ul style="margin: 5px 0; color: {COLORS['text']};">{invoices_html}</ul>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        For ACH payments, funds typically arrive within 1-2 business days. If you have any questions about this payment, 
        please reference the transaction number above when contacting us.
    </p>
    """
    return {
        "subject": f"Remittance Advice - Payment ${total_amount} Processed",
        "html": get_base_template(content)
    }

def vendor_document_status_email(vendor_name: str, document_type: str, status: str, reason: str = "", expiry_days: int = 0) -> dict:
    """Document approval/rejection/expiration notification"""
    if status == "approved":
        title = "✓ Document Approved"
        color = "#4CAF50"
        message = f"Your {document_type} has been approved and is now on file."
    elif status == "rejected":
        title = "Document Requires Attention"
        color = "#F44336"
        message = f"Your {document_type} needs to be corrected and resubmitted."
    else:  # expiring
        title = "⚠ Document Expiring Soon"
        color = "#FFA500"
        message = f"Your {document_type} will expire in {expiry_days} days. Please upload an updated document."
    
    reason_html = f"""
    <div style="background-color: rgba(244, 67, 54, 0.1); border-left: 4px solid #F44336; padding: 15px; margin: 15px 0;">
        <p style="margin: 0; color: #F44336; font-weight: bold;">Reason:</p>
        <p style="margin: 10px 0 0 0; color: {COLORS['text']};">{reason}</p>
    </div>
    """ if reason else ""
    
    content = f"""
    <h2 style="color: {color}; margin-top: 0;">{title}</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">{message}</p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 1px solid {COLORS['primary']}; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: {COLORS['primary']}; font-weight: bold;">Document:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Type:</strong> {document_type}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Status:</strong> <span style="color: {color};">{status.upper()}</span></p>
    </div>
    
    {reason_html}
    
    {get_button_html('Manage Documents', 'https://crm-command-1.preview.emergentagent.com/company-documents')}
    """
    return {
        "subject": f"Document {status.title()}: {document_type}",
        "html": get_base_template(content)
    }

# ============================================
# EMPLOYEE EMAIL TEMPLATES
# ============================================

def employee_paystub_available_email(employee_name: str, pay_period: str, gross_amount: str, net_amount: str, pay_date: str, portal_url: str) -> dict:
    """Notification when paystub is available"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">Your Paystub is Ready</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hello {employee_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        Your paystub for {pay_period} is now available for viewing and download.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 1px solid {COLORS['primary']}; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: {COLORS['primary']}; font-weight: bold;">Pay Period Summary:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Pay Period:</strong> {pay_period}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Gross Pay:</strong> ${gross_amount}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Net Pay:</strong> <span style="color: {COLORS['primary']}; font-size: 18px;">${net_amount}</span></p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Pay Date:</strong> {pay_date}</p>
    </div>
    
    {get_button_html('View Paystub', portal_url)}
    """
    return {
        "subject": f"Paystub Available - {pay_period}",
        "html": get_base_template(content)
    }

def employee_payment_processed_email(employee_name: str, amount: str, pay_date: str, account_last4: str) -> dict:
    """Confirmation when direct deposit is processed"""
    content = f"""
    <h2 style="color: #4CAF50; margin-top: 0;">✓ Payment Processed</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hello {employee_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        Your payment has been successfully processed and deposited.
    </p>
    
    <div style="background-color: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; border-radius: 5px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 15px 0; color: #4CAF50; font-weight: bold; font-size: 18px;">Direct Deposit Confirmation</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Amount Deposited:</strong> <span style="color: #4CAF50; font-size: 20px;">${amount}</span></p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Deposit Date:</strong> {pay_date}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Account Ending In:</strong> {account_last4}</p>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        Funds are typically available in your account within 1-2 business days. 
        View your complete paystub in the employee portal.
    </p>
    
    {get_button_html('View Paystub', 'https://crm-command-1.preview.emergentagent.com/my-payroll-documents')}
    """
    return {
        "subject": f"Payment Deposited - ${amount}",
        "html": get_base_template(content)
    }

def employee_assignment_notification(employee_name: str, item_type: str, item_title: str, assigned_by: str, due_date: str, portal_url: str) -> dict:
    """Notification when employee is assigned to task/project/work order"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">New {item_type} Assignment</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hello {employee_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        You have been assigned to a new {item_type.lower()}.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 1px solid {COLORS['primary']}; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: {COLORS['primary']}; font-weight: bold;">Assignment Details:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>{item_type}:</strong> {item_title}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Assigned By:</strong> {assigned_by}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Due Date:</strong> {due_date}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Please log in to the portal to view full details and begin work.
    </p>
    
    {get_button_html(f'View {item_type}', portal_url)}
    """
    return {
        "subject": f"New Assignment: {item_title}",
        "html": get_base_template(content)
    }

# ============================================
# GENERAL NOTIFICATION TEMPLATES
# ============================================

def schedule_change_notification(user_name: str, change_type: str, old_value: str, new_value: str, changed_by: str) -> dict:
    """Schedule or assignment change notification"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">Schedule Updated</h2>
    <p style="font-size: 16px; line-height: 1.6;">Hello {user_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        Your schedule has been updated.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 1px solid {COLORS['primary']}; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: {COLORS['primary']}; font-weight: bold;">Change Details:</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Type:</strong> {change_type}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Previous:</strong> {old_value}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Updated:</strong> {new_value}</p>
        <p style="margin: 5px 0; color: {COLORS['text']};"><strong>Changed By:</strong> {changed_by}</p>
    </div>
    
    {get_button_html('View Schedule', 'https://crm-command-1.preview.emergentagent.com/schedules')}
    """
    return {
        "subject": f"Schedule Update: {change_type}",
        "html": get_base_template(content)
    }


def vendor_account_created_email(vendor_name: str, contact_name: str, email: str, temp_password: str, portal_url: str) -> dict:
    """Email sent to vendor when account is created with login credentials"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">Welcome to Williams Diversified LLC Vendor Portal</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {contact_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        Your vendor account has been created for <strong>{vendor_name}</strong>. 
        You can now access the Vendor Portal to complete your company profile, upload required documents, 
        and manage invoices and payments.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 2px solid {COLORS['primary']}; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0 0 15px 0; color: {COLORS['primary']}; font-size: 18px; font-weight: bold; text-align: center;">
            YOUR LOGIN CREDENTIALS
        </p>
        <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold; width: 40%;">Email/Username:</td>
                <td style="color: {COLORS['primary']}; font-weight: bold; font-size: 16px;">{email}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Temporary Password:</td>
                <td style="color: {COLORS['primary']}; font-weight: bold; font-size: 16px; letter-spacing: 1px;">{temp_password}</td>
            </tr>
        </table>
        <p style="margin: 15px 0 0 0; font-size: 13px; color: {COLORS['muted']}; text-align: center;">
            ⚠️ You will be required to change your password on first login
        </p>
    </div>
    
    <div style="background-color: rgba(255, 165, 0, 0.1); border-left: 4px solid #FFA500; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: {COLORS['text']};">
            <strong>Important:</strong> After logging in, you will need to complete your vendor profile by providing:
        </p>
        <ul style="margin: 10px 0; padding-left: 20px; color: {COLORS['text']};">
            <li>Company EIN (Tax ID)</li>
            <li>Insurance Information (Certificate of Insurance)</li>
            <li>Banking Information for payments</li>
            <li>Required Documents (W-9, COI, Business License)</li>
        </ul>
    </div>
    
    {get_button_html('Access Vendor Portal', portal_url)}
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        If you have any questions or need assistance, please contact us at {COMPANY_INFO['email']} or {COMPANY_INFO['phone']}.
    </p>
    
    <p style="font-size: 13px; line-height: 1.6; color: {COLORS['muted']}; margin-top: 30px;">
        <em>This is an automated message from {COMPANY_INFO['name']} Project Command Center.</em>


# ============================================
# VENDOR ASSIGNMENT NOTIFICATIONS
# ============================================

def vendor_work_order_assignment(vendor_name: str, work_order_number: str, work_order_title: str, assigned_by: str, start_date: str, location: str, portal_url: str) -> dict:
    """Notification when work order is assigned to vendor"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">New Work Order Assignment</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        You have been assigned to a new work order in the Williams Diversified LLC system.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 2px solid {COLORS['primary']}; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0 0 15px 0; color: {COLORS['primary']}; font-size: 18px; font-weight: bold;">
            Work Order Details
        </p>
        <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold; width: 40%;">Work Order #:</td>
                <td style="color: {COLORS['primary']}; font-weight: bold; font-size: 16px;">{work_order_number}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Title:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{work_order_title}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Start Date:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{start_date}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Location:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{location}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Assigned By:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{assigned_by}</td>
            </tr>
        </table>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Please review the work order details and requirements in the vendor portal.
    </p>
    
    {get_button_html('View Work Order', portal_url)}
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        If you have any questions about this work order, please contact the project manager or reach out to us at {COMPANY_INFO['email']}.
    </p>
    """
    return {
        "subject": f"New Work Order Assignment: {work_order_number}",
        "html": get_base_template(content)
    }

def vendor_project_assignment(vendor_name: str, project_name: str, project_description: str, assigned_by: str, start_date: str, end_date: str, portal_url: str) -> dict:
    """Notification when project is assigned to vendor"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">New Project Assignment</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        You have been assigned to a new project. We look forward to working with you on this engagement.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 2px solid {COLORS['primary']}; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0 0 15px 0; color: {COLORS['primary']}; font-size: 18px; font-weight: bold;">
            Project Details
        </p>
        <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold; width: 40%;">Project Name:</td>
                <td style="color: {COLORS['primary']}; font-weight: bold; font-size: 16px;">{project_name}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Description:</td>
                <td style="color: {COLORS['text']}; font-size: 14px;">{project_description}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Start Date:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{start_date}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">End Date:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{end_date}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Assigned By:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{assigned_by}</td>
            </tr>
        </table>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">
        Access the vendor portal to view complete project details, deliverables, and timelines.
    </p>
    
    {get_button_html('View Project', portal_url)}
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        For any project-related questions, please contact us at {COMPANY_INFO['email']} or {COMPANY_INFO['phone']}.
    </p>
    """
    return {
        "subject": f"New Project Assignment: {project_name}",
        "html": get_base_template(content)
    }

def vendor_task_assignment(vendor_name: str, task_title: str, task_description: str, assigned_by: str, due_date: str, priority: str, portal_url: str) -> dict:
    """Notification when task is assigned to vendor"""
    
    priority_colors = {
        "high": "#ff4444",
        "medium": "#FFA500",
        "low": "#4CAF50"
    }
    priority_color = priority_colors.get(priority.lower(), "#FFA500")
    
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">New Task Assignment</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {vendor_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        A new task has been assigned to you in the Project Command Center.
    </p>
    
    <div style="background-color: rgba(201, 169, 97, 0.1); border: 2px solid {COLORS['primary']}; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0 0 15px 0; color: {COLORS['primary']}; font-size: 18px; font-weight: bold;">
            Task Details
        </p>
        <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold; width: 40%;">Task:</td>
                <td style="color: {COLORS['primary']}; font-weight: bold; font-size: 16px;">{task_title}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Description:</td>
                <td style="color: {COLORS['text']}; font-size: 14px;">{task_description}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Due Date:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{due_date}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Priority:</td>
                <td style="color: {priority_color}; font-weight: bold; font-size: 16px; text-transform: uppercase;">{priority}</td>
            </tr>
            <tr>
                <td style="color: {COLORS['muted']}; font-weight: bold;">Assigned By:</td>
                <td style="color: {COLORS['text']}; font-size: 16px;">{assigned_by}</td>
            </tr>
        </table>
    </div>
    
    <div style="background-color: rgba(255, 165, 0, 0.1); border-left: 4px solid {priority_color}; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: {COLORS['text']};">
            <strong>Action Required:</strong> Please review this task and update its status in the vendor portal as you make progress.
        </p>
    </div>
    
    {get_button_html('View Task', portal_url)}
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        Questions? Contact us at {COMPANY_INFO['email']} or {COMPANY_INFO['phone']}.
    </p>
    """
    return {
        "subject": f"New Task Assignment: {task_title}",
        "html": get_base_template(content)
    }

    </p>
    """
    return {
        "subject": f"Your Vendor Portal Account - {COMPANY_INFO['name']}",
        "html": get_base_template(content)
    }
