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
    "logo_url": "data:image/png;base64,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"
}

# Brand colors
COLORS = {
    "primary": "#C9A961",  # Gold
    "background": "#000000",  # Black
    "text": "#FFFFFF",  # White
    "muted": "#888888"  # Gray
}

def get_base_template(content: str) -> str:
    """Base template with Williams Diversified branding - Mobile optimized"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{COMPANY_INFO['name']}</title>
        <style type="text/css">
            body {{ margin: 0 !important; padding: 0 !important; background-color: #f4f4f4 !important; }}
            .email-container {{ background-color: #000000 !important; }}
            .content-area {{ color: #FFFFFF !important; }}
        </style>
    </head>
    <body style="margin: 0 !important; padding: 0 !important; font-family: Arial, sans-serif !important; background-color: #f4f4f4 !important;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4 !important; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="background-color: {COLORS['background']} !important; border: 2px solid {COLORS['primary']}; border-radius: 8px; overflow: hidden; max-width: 600px;">
                        <!-- Header with Logo -->
                        <tr>
                            <td style="padding: 30px; text-align: center; background-color: {COLORS['background']} !important; border-bottom: 2px solid {COLORS['primary']};">
                                <img src="{COMPANY_INFO['logo_url']}" alt="{COMPANY_INFO['name']}" width="200" style="max-width: 200px; height: auto; display: block; margin: 0 auto;">
                                <h1 style="color: {COLORS['primary']} !important; margin: 15px 0 5px 0; font-size: 24px;">{COMPANY_INFO['name']}</h1>
                                <p style="color: {COLORS['muted']} !important; margin: 0; font-size: 14px;">Project Command Center</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td class="content-area" style="padding: 30px; color: {COLORS['text']} !important; background-color: {COLORS['background']} !important;">
                                {content}
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px; background-color: {COLORS['background']} !important; border-top: 2px solid {COLORS['primary']}; text-align: center;">
                                <p style="color: {COLORS['primary']} !important; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                                    {COMPANY_INFO['name']}
                                </p>
                                <p style="color: {COLORS['muted']} !important; margin: 0; font-size: 12px; line-height: 1.6;">
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
    
    {get_button_html('Manage Documents', 'https://williams-portal.preview.emergentagent.com/company-documents')}
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
    
    {get_button_html('View Paystub', 'https://williams-portal.preview.emergentagent.com/my-payroll-documents')}
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
    
    {get_button_html('View Schedule', 'https://williams-portal.preview.emergentagent.com/schedules')}
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
    </p>
    """
    return {
        "subject": f"Your Vendor Portal Account - {COMPANY_INFO['name']}",
        "html": get_base_template(content)
    }

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


# ============================================
# EMPLOYEE ASSIGNMENT NOTIFICATIONS
# ============================================

def employee_work_order_assignment(employee_name: str, work_order_number: str, work_order_title: str, assigned_by: str, start_date: str, location: str, portal_url: str) -> dict:
    """Notification when work order is assigned to employee"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">New Work Order Assignment</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {employee_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        You have been assigned to a new work order.
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
        Please review the work order details and requirements in the portal.
    </p>
    
    {get_button_html('View Work Order', portal_url)}
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        If you have any questions about this work order, please contact your supervisor or reach out to us at {COMPANY_INFO['email']}.
    </p>
    """
    return {
        "subject": f"New Work Order Assignment: {work_order_number}",
        "html": get_base_template(content)
    }

def employee_project_assignment(employee_name: str, project_name: str, project_description: str, assigned_by: str, start_date: str, end_date: str, portal_url: str) -> dict:
    """Notification when project is assigned to employee"""
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">New Project Assignment</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {employee_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">
        You have been assigned to a new project.
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
        Please access the portal to view complete project details, milestones, and related tasks.
    </p>
    
    {get_button_html('View Project', portal_url)}
    
    <p style="font-size: 14px; line-height: 1.6; color: {COLORS['muted']};">
        Questions? Contact us at {COMPANY_INFO['email']} or {COMPANY_INFO['phone']}.
    </p>
    """
    return {
        "subject": f"New Project Assignment: {project_name}",
        "html": get_base_template(content)
    }

def employee_task_assignment(employee_name: str, task_title: str, task_description: str, due_date: str, priority: str, assigned_by: str, portal_url: str) -> dict:
    """Notification when task is assigned to employee"""
    priority_colors = {
        "high": "#FF0000",
        "medium": "#FFA500", 
        "low": "#00FF00"
    }
    priority_color = priority_colors.get(priority.lower(), COLORS['primary'])
    
    content = f"""
    <h2 style="color: {COLORS['primary']}; margin-top: 0;">New Task Assignment</h2>
    <p style="font-size: 16px; line-height: 1.6;">Dear {employee_name},</p>
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
            <strong>Action Required:</strong> Please review this task and update its status in the portal as you make progress.
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
