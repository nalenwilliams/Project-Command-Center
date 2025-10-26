from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from email_service import get_email_service
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ============================================
# AUTHENTICATION UTILITIES
# ============================================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="User account is deactivated")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============================================
# PYDANTIC MODELS
# ============================================

# User Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    invitation_code: str  # Required for registration

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    role: str = "employee"  # admin, manager, employee
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

# Invitation Models
class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = "employee"

class Invitation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    role: str
    invitation_code: str
    used: bool = False
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime

# Client Models
class ClientCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Project Models
class ProjectCreate(BaseModel):
    name: str
    client_id: Optional[str] = None
    status: str = "not_started"  # not_started, in_progress, completed, on_hold
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    files: Optional[List[dict]] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client_id: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    files: Optional[List[dict]] = None

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    client_id: Optional[str] = None
    status: str = "not_started"
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Task Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: str = "todo"  # todo, in_progress, completed
    due_date: Optional[datetime] = None
    priority: str = "medium"  # low, medium, high
    files: Optional[List[dict]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    files: Optional[List[dict]] = None

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: str = "todo"
    due_date: Optional[datetime] = None
    priority: str = "medium"
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Employee Models
class EmployeeCreate(BaseModel):
    name: str
    employee_id: str
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[datetime] = None
    status: str = "active"  # active, on_leave, terminated
    handbooks: Optional[List[str]] = []
    policies: Optional[List[str]] = []
    notes: Optional[str] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    employee_id: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[datetime] = None
    status: Optional[str] = None
    handbooks: Optional[List[str]] = None
    policies: Optional[List[str]] = None
    notes: Optional[str] = None

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    employee_id: str
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[datetime] = None
    status: str = "active"
    handbooks: Optional[List[str]] = []
    policies: Optional[List[str]] = []
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Policy/Handbook Models
class PolicyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str  # handbook, safety, hr, compliance, general
    file_id: Optional[str] = None
    file_url: Optional[str] = None
    version: str = "1.0"
    effective_date: Optional[datetime] = None
    requires_acknowledgment: bool = False

class PolicyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    file_id: Optional[str] = None
    file_url: Optional[str] = None
    version: Optional[str] = None
    effective_date: Optional[datetime] = None
    requires_acknowledgment: Optional[bool] = None

class Policy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    category: str
    file_id: Optional[str] = None
    file_url: Optional[str] = None
    version: str = "1.0"
    effective_date: Optional[datetime] = None
    requires_acknowledgment: bool = False
    acknowledgments: Optional[List[dict]] = []  # [{user_id, user_name, acknowledged_at}]
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Dashboard Models
class DashboardStats(BaseModel):
    total_clients: int
    total_projects: int
    total_tasks: int
    total_employees: int
    active_projects: int
    completed_tasks: int

# Notification Settings Models
class NotificationSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_email: str
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    notify_task_created: bool = True
    notify_file_upload: bool = True
    notify_status_change: bool = True
    notify_assignments: bool = True
    enabled: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationSettingsUpdate(BaseModel):
    admin_email: Optional[str] = None
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    notify_task_created: Optional[bool] = None
    notify_file_upload: Optional[bool] = None
    notify_status_change: Optional[bool] = None
    notify_assignments: Optional[bool] = None
    enabled: Optional[bool] = None

# ============================================
# API ROUTES - AUTHENTICATION
# ============================================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Verify invitation code
    invitation = await db.invitations.find_one({
        "invitation_code": user_data.invitation_code,
        "used": False
    }, {"_id": 0})
    
    if not invitation:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation code")
    
    # Check if invitation has expired (7 days)
    if datetime.fromisoformat(invitation['expires_at']) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation code has expired")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_email = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify email matches invitation
    if user_data.email.lower() != invitation['email'].lower():
        raise HTTPException(status_code=400, detail="Email must match the invited email")
    
    # Create new user with role from invitation
    user = User(username=user_data.username, email=user_data.email, role=invitation['role'])
    user_dict = user.model_dump()
    user_dict['password_hash'] = get_password_hash(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Mark invitation as used
    await db.invitations.update_one(
        {"invitation_code": user_data.invitation_code},
        {"$set": {"used": True}}
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "email": user.email, "role": user.role}
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Check if user is active
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact admin.")
    
    # Verify password
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user['id']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user['id'], "username": user['username'], "email": user['email'], "role": user.get('role', 'employee')}
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user['id'], 
        "username": current_user['username'], 
        "email": current_user['email'],
        "role": current_user.get('role', 'employee'),
        "is_active": current_user.get('is_active', True)
    }

# ============================================
# API ROUTES - ADMIN - USER MANAGEMENT
# ============================================

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(admin_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    # Ensure all users have required fields with defaults
    for user in users:
        if 'role' not in user:
            user['role'] = 'employee'
        if 'is_active' not in user:
            user['is_active'] = True
    return users

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, admin_user: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return updated_user

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin_user: dict = Depends(get_admin_user)):
    # Prevent admin from deleting themselves
    if user_id == admin_user['id']:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ============================================
# API ROUTES - ADMIN - INVITATIONS
# ============================================

@api_router.post("/admin/invitations")
async def create_invitation(invitation_data: InvitationCreate, admin_user: dict = Depends(get_admin_user)):
    # Check if email already invited and unused
    existing = await db.invitations.find_one({
        "email": invitation_data.email,
        "used": False
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Active invitation already exists for this email")
    
    # Check if user already registered
    user_exists = await db.users.find_one({"email": invitation_data.email}, {"_id": 0})
    if user_exists:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Generate unique invitation code
    invitation_code = str(uuid.uuid4())[:8].upper()
    
    invitation = Invitation(
        email=invitation_data.email,
        role=invitation_data.role,
        invitation_code=invitation_code,
        created_by=admin_user['id'],
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    invitation_dict = invitation.model_dump()
    invitation_dict['created_at'] = invitation_dict['created_at'].isoformat()
    invitation_dict['expires_at'] = invitation_dict['expires_at'].isoformat()
    
    await db.invitations.insert_one(invitation_dict)
    
    return {
        "message": "Invitation created successfully",
        "invitation_code": invitation_code,
        "email": invitation_data.email,
        "role": invitation_data.role,
        "expires_at": invitation_dict['expires_at']
    }

@api_router.get("/admin/invitations")
async def get_invitations(admin_user: dict = Depends(get_admin_user)):
    invitations = await db.invitations.find({}, {"_id": 0}).to_list(1000)
    return invitations

@api_router.delete("/admin/invitations/{invitation_id}")
async def delete_invitation(invitation_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.invitations.delete_one({"id": invitation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"message": "Invitation deleted successfully"}

# ============================================
# API ROUTES - NOTIFICATION SETTINGS
# ============================================

@api_router.get("/admin/notification-settings")
async def get_notification_settings(admin_user: dict = Depends(get_admin_user)):
    """Get notification settings"""
    settings = await db.notification_settings.find_one({}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = {
            "id": str(uuid.uuid4()),
            "admin_email": "admin@williamsdiverse.com",
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_username": "",
            "smtp_password": "",
            "smtp_from_email": "",
            "notify_task_created": True,
            "notify_file_upload": True,
            "notify_status_change": True,
            "notify_assignments": True,
            "enabled": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notification_settings.insert_one(default_settings)
        return default_settings
    
    if isinstance(settings.get('updated_at'), datetime):
        settings['updated_at'] = settings['updated_at'].isoformat()
    return settings

@api_router.put("/admin/notification-settings")
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate, 
    admin_user: dict = Depends(get_admin_user)
):
    """Update notification settings"""
    current_settings = await db.notification_settings.find_one({}, {"_id": 0})
    
    if not current_settings:
        # Create new settings
        new_settings = {
            "id": str(uuid.uuid4()),
            "admin_email": "admin@williamsdiverse.com",
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_username": "",
            "smtp_password": "",
            "smtp_from_email": "",
            "notify_task_created": True,
            "notify_file_upload": True,
            "notify_status_change": True,
            "notify_assignments": True,
            "enabled": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        current_settings = new_settings
    
    # Update with provided values
    update_data = settings_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    for key, value in update_data.items():
        current_settings[key] = value
    
    # Update or insert
    await db.notification_settings.update_one(
        {},
        {"$set": current_settings},
        upsert=True
    )
    
    # Reload email service with new settings if enabled
    if current_settings.get('enabled'):
        get_email_service(
            smtp_server=current_settings.get('smtp_server'),
            smtp_port=current_settings.get('smtp_port'),
            username=current_settings.get('smtp_username'),
            password=current_settings.get('smtp_password'),
            from_email=current_settings.get('smtp_from_email')
        )
    
    return current_settings

@api_router.post("/admin/test-notification")
async def test_notification(admin_user: dict = Depends(get_admin_user)):
    """Send a test notification email"""
    settings = await db.notification_settings.find_one({}, {"_id": 0})
    
    if not settings or not settings.get('enabled'):
        raise HTTPException(status_code=400, detail="Email notifications are not enabled")
    
    email_service = get_email_service(
        smtp_server=settings.get('smtp_server'),
        smtp_port=settings.get('smtp_port'),
        username=settings.get('smtp_username'),
        password=settings.get('smtp_password'),
        from_email=settings.get('smtp_from_email')
    )
    
    success = email_service.send_email(
        to_email=settings.get('admin_email'),
        subject="Test Notification - Project Command Center",
        body="""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #C9A961; border: 2px solid #C9A961; border-radius: 8px;">
                    <h2 style="color: #C9A961;">Test Notification</h2>
                    <p>This is a test email from your Project Command Center notification system.</p>
                    <p>If you're seeing this, your email configuration is working correctly!</p>
                    <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #C9A961; color: #888;">
                        <em>Williams Diversified LLC - Project Command Center</em>
                    </p>
                </div>
            </body>
        </html>
        """
    )
    
    if success:
        return {"message": "Test email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email")

# ============================================
# API ROUTES - USERS
# ============================================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    # Ensure all users have required fields with defaults
    for user in users:
        if 'role' not in user:
            user['role'] = 'employee'
        if 'is_active' not in user:
            user['is_active'] = True
    return users

# ============================================
# API ROUTES - CLIENTS
# ============================================

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: dict = Depends(get_current_user)):
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    for client in clients:
        if isinstance(client['created_at'], str):
            client['created_at'] = datetime.fromisoformat(client['created_at'])
    return clients

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: dict = Depends(get_current_user)):
    client = Client(**client_data.model_dump(), created_by=current_user['id'])
    client_dict = client.model_dump()
    client_dict['created_at'] = client_dict['created_at'].isoformat()
    
    await db.clients.insert_one(client_dict)
    return client

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if isinstance(client['created_at'], str):
        client['created_at'] = datetime.fromisoformat(client['created_at'])
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientUpdate, current_user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = {k: v for k, v in client_data.model_dump().items() if v is not None}
    if update_data:
        await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    updated_client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if isinstance(updated_client['created_at'], str):
        updated_client['created_at'] = datetime.fromisoformat(updated_client['created_at'])
    return updated_client

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}

# ============================================
# API ROUTES - PROJECTS
# ============================================

@api_router.get("/projects", response_model=List[Project])
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    for project in projects:
        if isinstance(project['created_at'], str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if project.get('deadline') and isinstance(project['deadline'], str):
            project['deadline'] = datetime.fromisoformat(project['deadline'])
    return projects

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project = Project(**project_data.model_dump(), created_by=current_user['id'])
    project_dict = project.model_dump()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    if project_dict.get('deadline'):
        project_dict['deadline'] = project_dict['deadline'].isoformat()
    
    await db.projects.insert_one(project_dict)
    return project

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project['created_at'], str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    if project.get('deadline') and isinstance(project['deadline'], str):
        project['deadline'] = datetime.fromisoformat(project['deadline'])
    return project

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_data: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {k: v for k, v in project_data.model_dump().items() if v is not None}
    if update_data.get('deadline'):
        update_data['deadline'] = update_data['deadline'].isoformat()
    
    if update_data:
        await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated_project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if isinstance(updated_project['created_at'], str):
        updated_project['created_at'] = datetime.fromisoformat(updated_project['created_at'])
    if updated_project.get('deadline') and isinstance(updated_project['deadline'], str):
        updated_project['deadline'] = datetime.fromisoformat(updated_project['deadline'])
    return updated_project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# ============================================
# API ROUTES - FILE UPLOADS
# ============================================

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a file (image, document, plan, etc.)"""
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return file info
        return {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "stored_filename": unique_filename,
            "size": file_path.stat().st_size,
            "content_type": file.content_type,
            "uploaded_by": current_user['username'],
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path)

# ============================================
# API ROUTES - TASKS
# ============================================

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    for task in tasks:
        if isinstance(task['created_at'], str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
        if task.get('due_date') and isinstance(task['due_date'], str):
            task['due_date'] = datetime.fromisoformat(task['due_date'])
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    task = Task(**task_data.model_dump(), created_by=current_user['id'])
    task_dict = task.model_dump()
    task_dict['created_at'] = task_dict['created_at'].isoformat()
    if task_dict.get('due_date'):
        task_dict['due_date'] = task_dict['due_date'].isoformat()
    
    await db.tasks.insert_one(task_dict)
    return task

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if isinstance(task['created_at'], str):
        task['created_at'] = datetime.fromisoformat(task['created_at'])
    if task.get('due_date') and isinstance(task['due_date'], str):
        task['due_date'] = datetime.fromisoformat(task['due_date'])
    return task

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_data.model_dump().items() if v is not None}
    if update_data.get('due_date'):
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    if update_data:
        await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if isinstance(updated_task['created_at'], str):
        updated_task['created_at'] = datetime.fromisoformat(updated_task['created_at'])
    if updated_task.get('due_date') and isinstance(updated_task['due_date'], str):
        updated_task['due_date'] = datetime.fromisoformat(updated_task['due_date'])
    return updated_task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# ============================================
# API ROUTES - EMPLOYEES
# ============================================

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(current_user: dict = Depends(get_current_user)):
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    for employee in employees:
        if isinstance(employee['created_at'], str):
            employee['created_at'] = datetime.fromisoformat(employee['created_at'])
        if employee.get('hire_date') and isinstance(employee['hire_date'], str):
            employee['hire_date'] = datetime.fromisoformat(employee['hire_date'])
    return employees

@api_router.post("/employees", response_model=Employee)
async def create_employee(employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    # Check if employee_id already exists
    existing = await db.employees.find_one({"employee_id": employee_data.employee_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    employee = Employee(**employee_data.model_dump(), created_by=current_user['id'])
    employee_dict = employee.model_dump()
    employee_dict['created_at'] = employee_dict['created_at'].isoformat()
    if employee_dict.get('hire_date'):
        employee_dict['hire_date'] = employee_dict['hire_date'].isoformat()
    
    await db.employees.insert_one(employee_dict)
    return employee

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if isinstance(employee['created_at'], str):
        employee['created_at'] = datetime.fromisoformat(employee['created_at'])
    if employee.get('hire_date') and isinstance(employee['hire_date'], str):
        employee['hire_date'] = datetime.fromisoformat(employee['hire_date'])
    return employee

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_data: EmployeeUpdate, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = {k: v for k, v in employee_data.model_dump().items() if v is not None}
    if update_data.get('hire_date'):
        update_data['hire_date'] = update_data['hire_date'].isoformat()
    
    if update_data:
        await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    updated_employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if isinstance(updated_employee['created_at'], str):
        updated_employee['created_at'] = datetime.fromisoformat(updated_employee['created_at'])
    if updated_employee.get('hire_date') and isinstance(updated_employee['hire_date'], str):
        updated_employee['hire_date'] = datetime.fromisoformat(updated_employee['hire_date'])
    return updated_employee

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}

# ============================================
# API ROUTES - DASHBOARD
# ============================================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_clients = await db.clients.count_documents({})
    total_projects = await db.projects.count_documents({})
    total_tasks = await db.tasks.count_documents({})
    total_employees = await db.employees.count_documents({})
    active_projects = await db.projects.count_documents({"status": "in_progress"})
    completed_tasks = await db.tasks.count_documents({"status": "completed"})
    
    return DashboardStats(
        total_clients=total_clients,
        total_projects=total_projects,
        total_tasks=total_tasks,
        total_employees=total_employees,
        active_projects=active_projects,
        completed_tasks=completed_tasks
    )

# ============================================
# SEED ENDPOINT FOR TESTING
# ============================================
@api_router.post("/seed/admin")
async def seed_admin_user():
    """Create a test admin user for preview/testing purposes"""
    try:
        # Check if admin already exists
        existing_admin = await db.users.find_one({"email": "admin@williamsdiversified.com"}, {"_id": 0})
        if existing_admin:
            return {
                "message": "Admin user already exists",
                "credentials": {
                    "username": "admin",
                    "password": "Admin123!",
                    "email": "admin@williamsdiversified.com",
                    "role": "admin"
                }
            }
        
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@williamsdiversified.com",
            "password_hash": get_password_hash("Admin123!"),
            "role": "admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.insert_one(admin_user)
        
        return {
            "message": "Admin user created successfully",
            "credentials": {
                "username": "admin",
                "password": "Admin123!",
                "email": "admin@williamsdiversified.com",
                "role": "admin"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating admin user: {str(e)}")

@api_router.post("/seed/test-users")
async def seed_test_users():
    """Create test users for different roles"""
    try:
        test_users = [
            {
                "id": str(uuid.uuid4()),
                "username": "manager",
                "email": "manager@williamsdiversified.com",
                "password_hash": get_password_hash("Manager123!"),
                "role": "manager",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "username": "employee",
                "email": "employee@williamsdiversified.com",
                "password_hash": get_password_hash("Employee123!"),
                "role": "employee",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        created_users = []
        for user in test_users:
            existing = await db.users.find_one({"email": user["email"]}, {"_id": 0})
            if not existing:
                await db.users.insert_one(user)
                created_users.append({
                    "username": user["username"],
                    "password": user["username"].capitalize() + "123!",
                    "email": user["email"],
                    "role": user["role"]
                })
        
        return {
            "message": f"Created {len(created_users)} test users",
            "users": created_users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating test users: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
