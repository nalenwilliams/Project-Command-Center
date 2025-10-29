import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
import os
from email_templates import (
    employee_work_order_assignment,
    employee_project_assignment,
    employee_task_assignment,
    vendor_work_order_assignment,
    vendor_project_assignment,
    vendor_task_assignment
)

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, smtp_server: str, smtp_port: int, username: str, password: str, from_email: str):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.from_email = from_email
        self.enabled = bool(smtp_server and username and password)
    
    def send_email(self, to_email: str, subject: str, body: str, html: bool = True) -> bool:
        """Send an email notification"""
        if not self.enabled:
            logger.warning("Email service not configured. Skipping email send.")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            if html:
                html_part = MIMEText(body, 'html')
                msg.attach(html_part)
            else:
                text_part = MIMEText(body, 'plain')
                msg.attach(text_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_task_created_notification(self, admin_email: str, task_title: str, created_by: str, project_name: str = "N/A"):
        """Notify admin when a new task is created"""
        subject = f"New Task Created: {task_title}"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #C9A961; border: 2px solid #C9A961; border-radius: 8px;">
                    <h2 style="color: #C9A961; border-bottom: 2px solid #C9A961; padding-bottom: 10px;">New Task Created</h2>
                    <p><strong>Task Title:</strong> {task_title}</p>
                    <p><strong>Created By:</strong> {created_by}</p>
                    <p><strong>Project:</strong> {project_name}</p>
                    <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #C9A961; color: #888;">
                        <em>Williams Diversified LLC - Project Command Center</em>
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(admin_email, subject, body)
    
    def send_file_upload_notification(self, admin_email: str, filename: str, uploaded_by: str, item_type: str, item_title: str):
        """Notify admin when a file is uploaded"""
        subject = f"File Uploaded: {filename}"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #C9A961; border: 2px solid #C9A961; border-radius: 8px;">
                    <h2 style="color: #C9A961; border-bottom: 2px solid #C9A961; padding-bottom: 10px;">File Uploaded</h2>
                    <p><strong>Filename:</strong> {filename}</p>
                    <p><strong>Uploaded By:</strong> {uploaded_by}</p>
                    <p><strong>{item_type}:</strong> {item_title}</p>
                    <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #C9A961; color: #888;">
                        <em>Williams Diversified LLC - Project Command Center</em>
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(admin_email, subject, body)
    
    def send_task_status_change_notification(self, admin_email: str, task_title: str, old_status: str, new_status: str, changed_by: str):
        """Notify admin when task status changes"""
        subject = f"Task Status Changed: {task_title}"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #C9A961; border: 2px solid #C9A961; border-radius: 8px;">
                    <h2 style="color: #C9A961; border-bottom: 2px solid #C9A961; padding-bottom: 10px;">Task Status Updated</h2>
                    <p><strong>Task:</strong> {task_title}</p>
                    <p><strong>Status Changed:</strong> {old_status} → {new_status}</p>
                    <p><strong>Changed By:</strong> {changed_by}</p>
                    <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #C9A961; color: #888;">
                        <em>Williams Diversified LLC - Project Command Center</em>
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(admin_email, subject, body)
    
    def send_assignment_notification(self, user_email: str, user_name: str, item_type: str, item_title: str, assigned_by: str):
        """Notify user when they are assigned to a task or project"""
        subject = f"You've Been Assigned to {item_type}: {item_title}"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #C9A961; border: 2px solid #C9A961; border-radius: 8px;">
                    <h2 style="color: #C9A961; border-bottom: 2px solid #C9A961; padding-bottom: 10px;">New Assignment</h2>
                    <p>Hello {user_name},</p>
                    <p>You have been assigned to a {item_type.lower()}:</p>
                    <p><strong>{item_type}:</strong> {item_title}</p>
                    <p><strong>Assigned By:</strong> {assigned_by}</p>
                    <p style="margin-top: 20px;">Please log in to the Project Command Center to view details and take action.</p>
                    <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #C9A961; color: #888;">
                        <em>Williams Diversified LLC - Project Command Center</em>
                    </p>
                </div>
            </body>
        </html>
        """
        return self.send_email(user_email, subject, body)
    
    async def send_task_assignment_email(self, to_email: str, user_name: str, user_role: str, task_title: str, 
                                        task_description: str, due_date: str, priority: str, assigned_by: str, 
                                        portal_url: str):
        """Send task assignment notification based on user role"""
        if user_role == 'vendor':
            email_data = vendor_task_assignment_email(
                vendor_name=user_name,
                task_title=task_title,
                task_description=task_description,
                due_date=due_date,
                priority=priority,
                assigned_by=assigned_by,
                portal_url=portal_url
            )
        else:  # employee, admin, hr, manager
            email_data = employee_task_assignment(
                employee_name=user_name,
                task_title=task_title,
                task_description=task_description,
                due_date=due_date,
                priority=priority,
                assigned_by=assigned_by,
                portal_url=portal_url
            )
        
        return self.send_email(to_email, email_data['subject'], email_data['html'])
    
    async def send_project_assignment_email(self, to_email: str, user_name: str, user_role: str, project_name: str,
                                           project_description: str, start_date: str, end_date: str, 
                                           assigned_by: str, portal_url: str):
        """Send project assignment notification based on user role"""
        if user_role == 'vendor':
            email_data = vendor_project_assignment_email(
                vendor_name=user_name,
                project_name=project_name,
                project_description=project_description,
                start_date=start_date,
                end_date=end_date,
                assigned_by=assigned_by,
                portal_url=portal_url
            )
        else:  # employee, admin, hr, manager
            email_data = employee_project_assignment(
                employee_name=user_name,
                project_name=project_name,
                project_description=project_description,
                assigned_by=assigned_by,
                start_date=start_date,
                end_date=end_date,
                portal_url=portal_url
            )
        
        return self.send_email(to_email, email_data['subject'], email_data['html'])
    
    async def send_work_order_assignment_email(self, to_email: str, user_name: str, user_role: str, 
                                               work_order_number: str, work_order_title: str, 
                                               assigned_by: str, start_date: str, location: str, 
                                               portal_url: str):
        """Send work order assignment notification based on user role"""
        if user_role == 'vendor':
            email_data = vendor_work_order_assignment_email(
                vendor_name=user_name,
                work_order_number=work_order_number,
                work_order_title=work_order_title,
                assigned_by=assigned_by,
                start_date=start_date,
                location=location,
                portal_url=portal_url
            )
        else:  # employee, admin, hr, manager
            email_data = employee_work_order_assignment(
                employee_name=user_name,
                work_order_number=work_order_number,
                work_order_title=work_order_title,
                assigned_by=assigned_by,
                start_date=start_date,
                location=location,
                portal_url=portal_url
            )
        
        return self.send_email(to_email, email_data['subject'], email_data['html'])


# Global email service instance
_email_service = None

def get_email_service(smtp_server: Optional[str] = None, smtp_port: Optional[int] = None, 
                     username: Optional[str] = None, password: Optional[str] = None, 
                     from_email: Optional[str] = None) -> EmailService:
    """Get or create email service instance"""
    global _email_service
    
    if _email_service is None or smtp_server is not None:
        # Create new instance with provided settings or defaults
        _email_service = EmailService(
            smtp_server=smtp_server or os.environ.get('SMTP_SERVER', ''),
            smtp_port=smtp_port or int(os.environ.get('SMTP_PORT', 587)),
            username=username or os.environ.get('SMTP_USERNAME', ''),
            password=password or os.environ.get('SMTP_PASSWORD', ''),
            from_email=from_email or os.environ.get('SMTP_FROM_EMAIL', '')
        )
    
    return _email_service
