from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Form, Cookie, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from email_service import get_email_service
import shutil
from authlib.integrations.starlette_client import OAuth

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OAuth Configuration
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Create the main app without a prefix
app = FastAPI()

# Add session middleware for OAuth (required by authlib)
app.add_middleware(SessionMiddleware, secret_key=os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production'))

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

async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
):
    """
    Authenticate user from session_token cookie (priority) or Authorization header (fallback)
    """
    token = None
    
    # Priority 1: Check session_token from cookie (Emergent Auth)
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            # Check if session is expired
            if datetime.fromisoformat(session['expires_at']) > datetime.now(timezone.utc):
                user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
                if user and user.get('is_active', True):
                    return user
    
    # Priority 2: Check Authorization header (existing JWT system)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif request.headers.get("Authorization"):
        auth_header = request.headers.get("Authorization")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
        except Exception as e:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.get('is_active', True):
            raise HTTPException(status_code=403, detail="User account is deactivated")
        return user
    
    raise HTTPException(status_code=401, detail="Not authenticated")

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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    invitation_code: str  # Required for registration

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    picture: Optional[str] = None  # Google profile picture
    role: str = "employee"  # admin, manager, employee, vendor
    is_active: bool = True
    onboarding_completed: bool = False  # Track onboarding completion status
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    picture: Optional[str] = None
    role: str
    is_active: bool
    onboarding_completed: bool = False

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    picture: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    onboarding_completed: Optional[bool] = None

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    address: Optional[str] = None
    assigned_to: Optional[List[str]] = []  # Changed to List for multiple users
    files: Optional[List[dict]] = []
    created_by: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client_id: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    address: Optional[str] = None
    assigned_to: Optional[List[str]] = None  # Changed to List for multiple users
    files: Optional[List[dict]] = None

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    client_id: Optional[str] = None
    status: str = "not_started"
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    address: Optional[str] = None
    assigned_to: Optional[List[str]] = []  # Changed to List for multiple users
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @field_validator('assigned_to', mode='before')
    @classmethod
    def convert_assigned_to_list(cls, v):
        """Convert single string to list for backward compatibility"""
        if isinstance(v, str):
            return [v] if v else []
        elif isinstance(v, list):
            return v
        elif v is None:
            return []
        return []

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[List[str]] = []  # Changed to List for multiple users
    status: str = "todo"  # todo, in_progress, completed
    due_date: Optional[datetime] = None
    priority: str = "medium"  # low, medium, high
    address: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[List[str]] = None  # Changed to List for multiple users
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    address: Optional[str] = None
    files: Optional[List[dict]] = None

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[List[str]] = []  # Changed to List for multiple users
    status: str = "todo"
    due_date: Optional[datetime] = None
    priority: str = "medium"
    address: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @field_validator('assigned_to', mode='before')
    @classmethod
    def convert_assigned_to_list(cls, v):
        """Convert single string to list for backward compatibility"""
        if isinstance(v, str):
            return [v] if v else []
        elif isinstance(v, list):
            return v
        elif v is None:
            return []
        return []

class WorkOrderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[List[str]] = []
    status: str = "todo"  # todo, in_progress, completed
    due_date: Optional[datetime] = None
    priority: str = "medium"  # urgent, high, medium, low
    address: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: Optional[str] = None

class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[List[str]] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    address: Optional[str] = None
    files: Optional[List[dict]] = None

class WorkOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    assigned_to: Optional[List[str]] = []
    status: str = "todo"
    due_date: Optional[datetime] = None
    priority: str = "medium"
    address: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @field_validator('assigned_to', mode='before')
    @classmethod
    def convert_assigned_to_list(cls, v):
        """Convert single string to list for backward compatibility"""
        if isinstance(v, str):
            return [v] if v else []
        elif isinstance(v, list):
            return v
        elif v is None:
            return []
        return []

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

# Fleet Inspection Report Models
class FleetInspectionCreate(BaseModel):
    vehicle_name: str
    vehicle_number: Optional[str] = None
    inspector_name: str
    inspection_date: datetime
    mileage: Optional[str] = None
    location: Optional[str] = None
    status: str = "pass"  # pass, fail, needs_repair
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class FleetInspectionUpdate(BaseModel):
    vehicle_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    inspector_name: Optional[str] = None
    inspection_date: Optional[datetime] = None
    mileage: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class FleetInspection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vehicle_name: str
    vehicle_number: Optional[str] = None
    inspector_name: str
    inspection_date: datetime
    mileage: Optional[str] = None
    location: Optional[str] = None
    status: str = "pass"
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Invoice Models
class InvoiceCreate(BaseModel):
    invoice_number: str
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    amount: float
    due_date: Optional[datetime] = None
    status: str = "draft"  # draft, sent, paid, overdue
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    amount: float
    due_date: Optional[datetime] = None
    status: str = "draft"
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Expense Models
class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str  # materials, labor, equipment, travel, other
    project_id: Optional[str] = None
    expense_date: datetime
    receipt_number: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    project_id: Optional[str] = None
    expense_date: Optional[datetime] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    amount: float
    category: str
    project_id: Optional[str] = None
    expense_date: datetime
    receipt_number: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Report Models
class ReportCreate(BaseModel):
    title: str
    report_type: str  # financial, operational, safety, etc.
    period: Optional[str] = None
    description: Optional[str] = None
    generated_by: Optional[str] = None
    files: Optional[List[dict]] = []

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    report_type: Optional[str] = None
    period: Optional[str] = None
    description: Optional[str] = None
    generated_by: Optional[str] = None
    files: Optional[List[dict]] = None

class Report(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    report_type: str
    period: Optional[str] = None
    description: Optional[str] = None
    generated_by: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Compliance Models
class ComplianceCreate(BaseModel):
    title: str
    compliance_type: str  # regulatory, safety, environmental, etc.
    requirement: Optional[str] = None
    status: str = "pending"  # pending, compliant, non_compliant
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    files: Optional[List[dict]] = []

class ComplianceUpdate(BaseModel):
    title: Optional[str] = None
    compliance_type: Optional[str] = None
    requirement: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    files: Optional[List[dict]] = None

class Compliance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    compliance_type: str
    requirement: Optional[str] = None
    status: str = "pending"
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Contract Models
class ContractCreate(BaseModel):
    title: str
    client_id: Optional[str] = None
    contract_number: Optional[str] = None
    value: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str = "active"  # active, completed, terminated
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    client_id: Optional[str] = None
    contract_number: Optional[str] = None
    value: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    client_id: Optional[str] = None
    contract_number: Optional[str] = None
    value: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str = "active"
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Equipment/Asset Models
class EquipmentCreate(BaseModel):
    name: str
    equipment_type: str  # vehicle, tool, machinery, other
    serial_number: Optional[str] = None
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[datetime] = None
    status: str = "available"  # available, in_use, maintenance, retired
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    equipment_type: Optional[str] = None
    serial_number: Optional[str] = None
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class Equipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    equipment_type: str
    serial_number: Optional[str] = None
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[datetime] = None
    status: str = "available"
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Timesheet Models
class TimesheetCreate(BaseModel):
    employee_name: str
    date: datetime
    hours_worked: float
    project_id: Optional[str] = None
    task_description: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class TimesheetUpdate(BaseModel):
    employee_name: Optional[str] = None
    date: Optional[datetime] = None
    hours_worked: Optional[float] = None
    project_id: Optional[str] = None
    task_description: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class Timesheet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_name: str
    date: datetime
    hours_worked: float
    project_id: Optional[str] = None
    task_description: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Safety Report Models
class SafetyReportCreate(BaseModel):
    incident_type: str  # injury, near_miss, hazard, violation
    severity: str  # low, medium, high, critical
    location: str
    incident_date: datetime
    reported_by: str
    persons_involved: Optional[str] = None
    description: str
    corrective_action: Optional[str] = None
    status: str = "open"  # open, under_review, resolved
    files: Optional[List[dict]] = []

class SafetyReportUpdate(BaseModel):
    incident_type: Optional[str] = None
    severity: Optional[str] = None
    location: Optional[str] = None
    incident_date: Optional[datetime] = None
    reported_by: Optional[str] = None
    persons_involved: Optional[str] = None
    description: Optional[str] = None
    corrective_action: Optional[str] = None
    status: Optional[str] = None
    files: Optional[List[dict]] = None

class SafetyReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    incident_type: str
    severity: str
    location: str
    incident_date: datetime
    reported_by: str
    persons_involved: Optional[str] = None
    description: str
    corrective_action: Optional[str] = None
    status: str = "open"
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Certification Models
class CertificationCreate(BaseModel):
    employee_name: str
    certification_type: str  # license, permit, training, qualification
    certification_name: str
    issuing_authority: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: str = "active"  # active, expired, pending_renewal
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class CertificationUpdate(BaseModel):
    employee_name: Optional[str] = None
    certification_type: Optional[str] = None
    certification_name: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class Certification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_name: str
    certification_type: str
    certification_name: str
    issuing_authority: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: str = "active"
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Inventory Models
class InventoryCreate(BaseModel):
    item_name: str
    category: str  # materials, supplies, parts, consumables
    quantity: float
    unit: str  # pieces, boxes, gallons, etc
    project_id: Optional[str] = None  # Optional for backward compatibility, but recommended
    location: Optional[str] = None
    minimum_stock: Optional[float] = None
    supplier: Optional[str] = None
    unit_cost: Optional[float] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = []

class InventoryUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    project_id: Optional[str] = None
    location: Optional[str] = None
    minimum_stock: Optional[float] = None
    supplier: Optional[str] = None
    unit_cost: Optional[float] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = None

class Inventory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    category: str
    quantity: float
    unit: str
    project_id: Optional[str] = None  # Optional for backward compatibility
    location: Optional[str] = None
    minimum_stock: Optional[float] = None
    supplier: Optional[str] = None
    unit_cost: Optional[float] = None
    notes: Optional[str] = None
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Document/Report Models
class DocumentCreate(BaseModel):
    title: str
    category: str  # report, procedure, form, general
    document_type: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    files: Optional[List[dict]] = []

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    document_type: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    files: Optional[List[dict]] = None

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    document_type: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    files: Optional[List[dict]] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    user = User(
        username=user_data.username, 
        email=user_data.email, 
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=invitation['role']
    )
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
        "user": {
            "id": user.id, 
            "username": user.username, 
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
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
        "user": {
            "id": user['id'], 
            "username": user['username'], 
            "email": user['email'],
            "first_name": user.get('first_name'),
            "last_name": user.get('last_name'),
            "role": user.get('role', 'employee'),
            "onboarding_completed": user.get('onboarding_completed', False)
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user['id'], 
        "username": current_user['username'], 
        "email": current_user['email'],
        "first_name": current_user.get('first_name'),
        "last_name": current_user.get('last_name'),
        "picture": current_user.get('picture'),
        "role": current_user.get('role', 'employee'),
        "is_active": current_user.get('is_active', True)
    }

# ============================================
# NATIVE GOOGLE OAUTH SSO
# ============================================

@api_router.get("/auth/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    backend_url = os.environ.get('FRONTEND_URL', 'https://crm-command-1.preview.emergentagent.com')
    redirect_uri = f"{backend_url}/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@api_router.get("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    """Handle Google OAuth callback"""
    try:
        # Get access token from Google
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from Google
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        user_email = user_info.get('email')
        user_name = user_info.get('name', '')
        user_picture = user_info.get('picture')
        given_name = user_info.get('given_name', '')
        family_name = user_info.get('family_name', '')
        
        if not user_email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_email}, {"_id": 0})
        
        if existing_user:
            # User exists, update picture if changed
            if user_picture and existing_user.get('picture') != user_picture:
                await db.users.update_one(
                    {"email": user_email},
                    {"$set": {"picture": user_picture}}
                )
            user = existing_user
        else:
            # Create new user from Google data
            new_user = User(
                username=user_email.split("@")[0],  # Use email prefix as username
                email=user_email,
                first_name=given_name,
                last_name=family_name,
                picture=user_picture,
                role="employee",  # Default role, admin can change later
                is_active=True
            )
            
            user_dict = new_user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            # No password_hash for OAuth users
            
            await db.users.insert_one(user_dict)
            user = user_dict
        
        # Create session in database
        session_token = str(uuid.uuid4())
        session_expires = datetime.now(timezone.utc) + timedelta(days=7)
        user_session = UserSession(
            user_id=user['id'],
            session_token=session_token,
            expires_at=session_expires
        )
        
        session_dict = user_session.model_dump()
        session_dict['created_at'] = session_dict['created_at'].isoformat()
        session_dict['expires_at'] = session_dict['expires_at'].isoformat()
        
        # Delete old sessions for this user
        await db.user_sessions.delete_many({"user_id": user['id']})
        
        # Insert new session
        await db.user_sessions.insert_one(session_dict)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="lax",  # Changed from "none" to "lax" for better mobile support
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        # Redirect to frontend with success indicator
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}/auth?google_success=true")
        
    except Exception as e:
        logging.error(f"Error in Google OAuth callback: {str(e)}")
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}/auth?google_error=true")

# ============================================

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    """Logout user by deleting session and clearing cookie"""
    try:
        # Delete all sessions for this user
        await db.user_sessions.delete_many({"user_id": current_user['id']})
        
        # Clear cookie
        response.delete_cookie(
            key="session_token",
            path="/",
            samesite="none",
            secure=True
        )
        
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        logging.error(f"Error during logout: {str(e)}")
        raise HTTPException(status_code=500, detail="Logout failed")

# ============================================
# AI SERVICE - Direct Gemini 2.5 Pro Integration
# ============================================

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

@api_router.post("/ai/chat")
async def ai_chat(request: Request, current_user: dict = Depends(get_current_user)):
    """AI chat assistant using Gemini 2.5 Flash (Fast version)"""
    try:
        body = await request.json()
        message = body.get('message', '')
        context = body.get('context', {})
        
        # Custom system message for Williams Diversified
        system_message = f"""You are the Williams Diversified LLC AI Assistant.

COMPANY PROFILE:
Company: Williams Diversified LLC
Description: Nationwide and worldwide rapid-deployment, base-operations, and infrastructure services company. Delivers turnkey emergency response, environmental, power, housing, and logistics solutions through an AI-integrated Command Center.

SCOPE & CAPABILITIES:
- Reach: Nationwide (all 50 states) and Worldwide (allied bases and overseas missions)
- Mobilization: 48 hours or less for U.S. deployments
- Owner/Authorized Officer: Nalen Williams

DIVISIONS:
1. Rapid Deployment: Disaster response, debris removal, site cleanup, FEMA & USACE logistics
2. Temporary Housing: Modular housing, base camps, RVs, utilities, crew accommodations
3. Emergency Power: Generator deployment, fueling, temporary grids, AI power monitoring
4. Environmental Services: Erosion control, hazardous waste, stormwater/soil remediation, EPA/USACE compliance
5. Security: Physical & digital site security, patrol, fencing, lighting, access control with AI cameras
6. Base Operations: BOS and O&M services for military/federal bases (LOGCAP V, AFCAP V, NAVFAC BOS, USACE O&M)

FEDERAL PARTNERS:
FEMA, USACE, DoD, GSA, AshBritt, Ceres Environmental, Phillips & Jordan, CrowderGulf, Amentum, Fluor, KBR, V2X, AECOM, Jacobs, WSP USA

COMMAND CENTER CAPABILITIES:
- AI Chat Assist & Auto-Proposal Generator
- Form-Fill Automation
- Certified Payroll System (WH-347)
- Employee Self-Onboarding
- Plaid Banking Integration
- Environmental & Compliance Modules
- Security Command Link
- Vendor Portal Automation

MISSION: Deliver high-performance, technology-driven solutions that sustain operations and restore infrastructure anywhere in the world.

GOALS:
- $10-15M annual revenue within 24-30 months
- Prime and subcontractor capability under FEMA, USACE, DoD programs
- Global operations expansion
- AI-automated workflows across all departments

YOUR ROLE:
- Help employees manage projects, tasks, work orders, and operations
- Provide disaster response, construction, and federal contracting advice
- Assist with payroll, compliance, environmental reporting
- Help compose professional communications
- Generate proposals and assist with data entry
- Answer questions about app features and workflows
- ONLY discuss Williams Diversified business topics
- Keep responses concise and actionable

CURRENT USER: {current_user.get('first_name', '')} {current_user.get('last_name', '')} ({current_user.get('role', 'employee')})
CURRENT PAGE: {context.get('current_page', 'Unknown')}

Focus on practical, mission-critical responses relevant to federal contracting and disaster response operations."""

        # Initialize chat with Gemini 2.5 Flash (much faster!)
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"user_{current_user['id']}",
            system_message=system_message
        ).with_model("gemini", "gemini-2.5-flash")  # Changed to Flash for speed
        
        # Create user message
        user_message = UserMessage(text=message)
        
        # Get response
        response = await chat.send_message(user_message)
        
        return {"reply": response}
    except Exception as e:
        logging.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.post("/ai/proposal")
async def ai_proposal(request: Request, current_user: dict = Depends(get_current_user)):
    """Generate construction proposal using Gemini 2.5 Flash"""
    try:
        body = await request.json()
        project = body.get('project', {})
        notes = body.get('notes', '')
        
        # Custom system message for Williams Diversified proposals
        system_message = """You are a federal contracting and disaster response proposal expert for Williams Diversified LLC.

COMPANY PROFILE:
Company: Williams Diversified LLC
Business: Nationwide and worldwide rapid-deployment, base-operations, and infrastructure services
Owner/Authorized Officer: Nalen Williams

DIVISIONS & SERVICES:
1. Rapid Deployment: FEMA/USACE disaster response, debris removal, site cleanup, logistics
2. Temporary Housing: Modular housing, base camps, RVs, utilities, crew accommodations
3. Emergency Power: Generator deployment, fueling, temporary grids, AI power monitoring
4. Environmental: Erosion control, hazardous waste, stormwater/soil remediation, EPA/USACE compliance
5. Security: Physical/digital site security, patrol, fencing, lighting, AI camera integration
6. Base Operations: Military/federal BOS and O&M (LOGCAP V, AFCAP V, NAVFAC BOS, USACE O&M)

FEDERAL CAPABILITIES:
- FEMA, USACE, DoD, GSA prime and subcontracting
- 48-hour mobilization for U.S. deployments
- Nationwide and worldwide operations
- Full compliance and audit integration

Generate professional federal contracting proposals in JSON format only.
Focus on disaster response, base operations, environmental services, and infrastructure."""

        # Initialize chat with Gemini 2.5 Flash (faster)
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"proposal_{current_user['id']}",
            system_message=system_message
        ).with_model("gemini", "gemini-2.5-flash")  # Changed to Flash
        
        prompt = f"""Generate a construction proposal for:
Project: {project}
Notes: {notes}

Return ONLY valid JSON with:
{{
  "scopeOfWork": "Detailed work description",
  "inclusions": [{{"trade": "Trade Name", "items": ["item1", "item2"]}}],
  "itemizedPricing": [{{"description": "Item", "cost": 0.00}}],
  "totalLumpSum": 0.00,
  "notes": "Terms and conditions"
}}"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Try to parse as JSON
        import json
        try:
            proposal_data = json.loads(response)
            return proposal_data
        except:
            return {"error": "Could not parse proposal", "raw_response": response}
            
    except Exception as e:
        logging.error(f"AI proposal error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.post("/ai/form-fill")
async def ai_formfill(request: Request, current_user: dict = Depends(get_current_user)):
    """Extract structured data from notes using Gemini 2.5 Pro"""
    try:
        body = await request.json()
        notes = body.get('notes', '')
        schema = body.get('schema', '')
        defaults = body.get('defaults', {})
        
        # Initialize chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"formfill_{current_user['id']}",
            system_message="You are a data extraction expert. Convert notes into structured JSON data."
        ).with_model("gemini", "gemini-2.5-pro")
        
        prompt = f"""Extract data from these notes and return JSON matching this schema:
Schema: {schema}
Notes: {notes}
Defaults: {defaults}

Return a JSON object with the extracted data."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Try to parse as JSON
        import json
        try:
            form_data = json.loads(response)
            return form_data
        except:
            return {"error": "Could not parse form data", "raw_response": response}
            
    except Exception as e:
        logging.error(f"AI form fill error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ============================================
# AI COMMAND ROUTER - Natural Language Navigation
# ============================================

# Screen registry for Williams Diversified app
SCREEN_REGISTRY = [
    {"key": "dashboard", "path": "/", "aliases": ["home", "command center", "main"]},
    {"key": "projects", "path": "/projects", "aliases": ["jobs", "sites"]},
    {"key": "tasks", "path": "/tasks", "aliases": ["to-do", "todos"]},
    {"key": "work-orders", "path": "/work-orders", "aliases": ["work orders", "jobs"]},
    {"key": "clients", "path": "/clients", "aliases": ["customers", "contacts"]},
    {"key": "employees", "path": "/employees", "aliases": ["staff", "team", "workers"]},
    {"key": "invoices", "path": "/invoices", "aliases": ["billing", "accounts receivable"]},
    {"key": "expenses", "path": "/expenses", "aliases": ["costs", "spending"]},
    {"key": "contracts", "path": "/contracts", "aliases": ["agreements"]},
    {"key": "equipment", "path": "/equipment", "aliases": ["tools", "machinery"]},
    {"key": "timesheets", "path": "/timesheets", "aliases": ["timecards", "hours", "clock"]},
    {"key": "inventory", "path": "/inventory", "aliases": ["stock", "materials"]},
    {"key": "schedules", "path": "/schedules", "aliases": ["calendar", "appointments"]},
    {"key": "safety", "path": "/safety-reports", "aliases": ["safety reports", "incidents"]},
    {"key": "certifications", "path": "/certifications", "aliases": ["licenses", "credentials"]},
    {"key": "reports", "path": "/reports", "aliases": ["analytics", "metrics"]},
    {"key": "compliance", "path": "/compliance", "aliases": ["regulations"]},
    {"key": "handbook", "path": "/handbook-policies", "aliases": ["policies", "procedures"]},
    {"key": "fleet", "path": "/fleet", "aliases": ["fleet inspection", "trucks", "vehicles"]},
    {"key": "admin", "path": "/admin", "aliases": ["admin panel", "settings", "users"]},
    {"key": "notifications", "path": "/notifications", "aliases": ["alerts", "email settings"]},
    {"key": "payroll", "path": "/payroll", "aliases": ["certified payroll", "wh-347", "pay run"]},
]

@api_router.post("/ai/command")
async def ai_command_router(request: Request, current_user: dict = Depends(get_current_user)):
    """Natural language navigation - e.g. 'open payroll', 'show me projects'"""
    try:
        body = await request.json()
        command = body.get('command', '').strip()
        
        if not command:
            return {"error": "Missing command"}
        
        # Try simple keyword matching first (fast)
        command_lower = command.lower()
        for screen in SCREEN_REGISTRY:
            if screen['key'] in command_lower or screen['path'] in command_lower:
                return {
                    "intent": "NAVIGATE",
                    "route": screen['path'],
                    "screen_key": screen['key'],
                    "confidence": 0.9,
                    "reason": "keyword_match"
                }
            for alias in screen['aliases']:
                if alias in command_lower:
                    return {
                        "intent": "NAVIGATE",
                        "route": screen['path'],
                        "screen_key": screen['key'],
                        "confidence": 0.85,
                        "reason": "alias_match"
                    }
        
        # If no simple match, use AI (Gemini Flash for speed)
        system_message = """You map user commands to app navigation routes.
Screen registry available:
""" + str([{"key": s['key'], "path": s['path'], "aliases": s['aliases']} for s in SCREEN_REGISTRY]) + """

Return JSON with:
- intent: "NAVIGATE" or "UNKNOWN"
- route: the path (e.g. "/projects") or empty
- screen_key: the screen key or empty
- confidence: 0-1
- reason: brief explanation"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"nav_{current_user['id']}",
            system_message=system_message
        ).with_model("gemini", "gemini-2.5-flash")
        
        user_message = UserMessage(text=f"User command: {command}")
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        try:
            result = json.loads(response)
            if result.get('intent') == 'NAVIGATE' and result.get('route'):
                return result
            else:
                return {
                    "intent": "UNKNOWN",
                    "suggestions": [s['path'] for s in SCREEN_REGISTRY[:5]]
                }
        except:
            return {
                "intent": "UNKNOWN",
                "suggestions": [s['path'] for s in SCREEN_REGISTRY[:5]]
            }
            
    except Exception as e:
        logging.error(f"Command router error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Command router error: {str(e)}")

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
    
    # Send invitation email
    try:
        # Get notification settings for email configuration
        notification_settings = await db.notification_settings.find_one({}, {"_id": 0})
        
        if notification_settings and notification_settings.get('smtp_server'):
            # Create registration link
            # Frontend is on the same domain as backend (which includes /api)
            # Get backend URL from environment or use default
            frontend_url = "https://crm-command-1.preview.emergentagent.com"
            
            # Registration link with invitation code as query parameter
            registration_link = f"{frontend_url}/auth?invite={invitation_code}"
            
            print(f"Generated registration link: {registration_link}")  # Debug log
            
            # Email subject
            subject = f"Invitation to Join Williams Diversified LLC - Project Command Center"
            
            # Professional HTML email body
            body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #C9A961; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }}
        .button {{ display: inline-block; background-color: #C9A961; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
        .button:hover {{ background-color: #b89951; }}
        .info-box {{ background: #f9f9f9; border-left: 4px solid #C9A961; padding: 15px; margin: 20px 0; }}
        .code {{ font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #C9A961; background: #f5f5f5; padding: 8px 12px; border-radius: 4px; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Williams Diversified LLC</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Project Command Center</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1a1a1a; margin-top: 0;">You've Been Invited!</h2>
            
            <p>Hello,</p>
            
            <p>You have been invited to join <strong>Williams Diversified LLC's Project Command Center</strong> as a <strong>{invitation_data.role.upper()}</strong>.</p>
            
            <div class="info-box">
                <p style="margin: 5px 0;"><strong>Your Invitation Details:</strong></p>
                <p style="margin: 5px 0;">👤 Role: <strong>{invitation_data.role.title()}</strong></p>
                <p style="margin: 5px 0;">🔑 Invitation Code: <span class="code">{invitation_code}</span></p>
                <p style="margin: 5px 0;">⏰ Expires: <strong>{datetime.fromisoformat(invitation_dict['expires_at']).strftime('%B %d, %Y at %I:%M %p UTC')}</strong></p>
            </div>
            
            <p><strong>To complete your registration, click the button below:</strong></p>
            
            <div style="text-align: center;">
                <a href="{registration_link}" class="button">Complete Registration</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">{registration_link}</p>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact your administrator.</p>
            
            <p style="margin-top: 20px;">Best regards,<br>
            <strong>Williams Diversified LLC Team</strong></p>
        </div>
        
        <div class="footer">
            <p>This invitation will expire in 7 days.</p>
            <p>If you did not expect this invitation, please disregard this email.</p>
            <p>&copy; 2025 Williams Diversified LLC. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
            
            # Send email using email service
            email_svc = get_email_service(
                smtp_server=notification_settings.get('smtp_server'),
                smtp_port=notification_settings.get('smtp_port'),
                username=notification_settings.get('smtp_username'),
                password=notification_settings.get('smtp_password'),
                from_email=notification_settings.get('admin_email', notification_settings.get('smtp_username'))
            )
            
            await email_svc.send_email(
                to_email=invitation_data.email,
                subject=subject,
                body=body
            )
            email_sent = True
        else:
            email_sent = False
    except Exception as e:
        print(f"Failed to send invitation email: {str(e)}")
        email_sent = False
    
    return {
        "message": "Invitation created successfully" + (" and email sent" if email_sent else " (email not configured)"),
        "invitation_code": invitation_code,
        "email": invitation_data.email,
        "role": invitation_data.role,
        "expires_at": invitation_dict['expires_at'],
        "email_sent": email_sent
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
    # Employees only see projects assigned to them
    if current_user.get('role') == 'employee':
        query = {"assigned_to": {"$in": [current_user['id']]}}
    else:
        # Admins and managers see all projects
        query = {}
    
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    for project in projects:
        if isinstance(project['created_at'], str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if project.get('deadline') and isinstance(project['deadline'], str):
            project['deadline'] = datetime.fromisoformat(project['deadline'])
    return projects

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project_dict = project_data.model_dump()
    project_dict['created_by'] = current_user['id']  # Override with current user
    project = Project(**project_dict)
    
    project_dict = project.model_dump()
    project_dict['created_at'] = project_dict['created_at'].isoformat()
    if project_dict.get('deadline'):
        project_dict['deadline'] = project_dict['deadline'].isoformat()
    
    await db.projects.insert_one(project_dict)
    
    # Send notifications to all assigned users
    if project.assigned_to:
        email_service = get_email_service()
        for user_id in project.assigned_to:
            try:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user and user.get('email'):
                    await email_service.send_assignment_notification(
                        to_email=user['email'],
                        user_name=user['username'],
                        item_type="Project",
                        item_name=project.name,
                        assigned_by=current_user['username']
                    )
            except Exception as e:
                print(f"Failed to send notification to user {user_id}: {e}")
    
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
    
    # Check for new user assignments
    old_assigned = set(project.get('assigned_to', []))
    new_assigned = set(update_data.get('assigned_to', []))
    newly_assigned = new_assigned - old_assigned
    
    if update_data:
        await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    # Send notifications to newly assigned users
    if newly_assigned:
        email_service = get_email_service()
        for user_id in newly_assigned:
            try:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user and user.get('email'):
                    await email_service.send_assignment_notification(
                        to_email=user['email'],
                        user_name=user['username'],
                        item_type="Project",
                        item_name=project['name'],
                        assigned_by=current_user['username']
                    )
            except Exception as e:
                print(f"Failed to send notification to user {user_id}: {e}")
    
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
    # Employees only see tasks assigned to them
    if current_user.get('role') == 'employee':
        query = {"assigned_to": {"$in": [current_user['id']]}}
    else:
        # Admins and managers see all tasks
        query = {}
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    for task in tasks:
        if isinstance(task['created_at'], str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
        if task.get('due_date') and isinstance(task['due_date'], str):
            task['due_date'] = datetime.fromisoformat(task['due_date'])
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_dict = task_data.model_dump()
    task_dict['created_by'] = current_user['id']  # Override with current user
    task = Task(**task_dict)
    
    task_dict = task.model_dump()
    task_dict['created_at'] = task_dict['created_at'].isoformat()
    if task_dict.get('due_date'):
        task_dict['due_date'] = task_dict['due_date'].isoformat()
    
    await db.tasks.insert_one(task_dict)
    
    # Send notifications to all assigned users
    if task.assigned_to:
        email_service = get_email_service()
        for user_id in task.assigned_to:
            try:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user and user.get('email'):
                    await email_service.send_assignment_notification(
                        to_email=user['email'],
                        user_name=user['username'],
                        item_type="Task",
                        item_name=task.title,
                        assigned_by=current_user['username']
                    )
            except Exception as e:
                print(f"Failed to send notification to user {user_id}: {e}")
    
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
    
    # Check for new user assignments
    old_assigned = set(task.get('assigned_to', []))
    new_assigned = set(update_data.get('assigned_to', []))
    newly_assigned = new_assigned - old_assigned
    
    if update_data:
        await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    # Send notifications to newly assigned users
    if newly_assigned:
        email_service = get_email_service()
        for user_id in newly_assigned:
            try:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user and user.get('email'):
                    await email_service.send_assignment_notification(
                        to_email=user['email'],
                        user_name=user['username'],
                        item_type="Task",
                        item_name=task['title'],
                        assigned_by=current_user['username']
                    )
            except Exception as e:
                print(f"Failed to send notification to user {user_id}: {e}")
    
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
# API ROUTES - WORK ORDERS
# ============================================

@api_router.get("/work-orders", response_model=List[WorkOrder])
async def get_work_orders(current_user: dict = Depends(get_current_user)):
    # Employees only see work orders assigned to them
    if current_user.get('role') == 'employee':
        query = {"assigned_to": {"$in": [current_user['id']]}}
    else:
        # Admins and managers see all work orders
        query = {}
    
    work_orders = await db.work_orders.find(query, {"_id": 0}).to_list(length=None)
    for work_order in work_orders:
        if isinstance(work_order['created_at'], str):
            work_order['created_at'] = datetime.fromisoformat(work_order['created_at'])
        if work_order.get('due_date') and isinstance(work_order['due_date'], str):
            work_order['due_date'] = datetime.fromisoformat(work_order['due_date'])
    return work_orders

@api_router.post("/work-orders", response_model=WorkOrder)
async def create_work_order(work_order_data: WorkOrderCreate, current_user: dict = Depends(get_current_user)):
    work_order_dict = work_order_data.model_dump()
    work_order_dict['created_by'] = current_user['id']  # Override with current user
    work_order = WorkOrder(**work_order_dict)
    
    work_order_dict = work_order.model_dump()
    work_order_dict['created_at'] = work_order_dict['created_at'].isoformat()
    if work_order_dict.get('due_date'):
        work_order_dict['due_date'] = work_order_dict['due_date'].isoformat()
    
    await db.work_orders.insert_one(work_order_dict)
    
    # Send notifications to all assigned users
    if work_order.assigned_to:
        email_service = get_email_service()
        for user_id in work_order.assigned_to:
            try:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user and user.get('email'):
                    await email_service.send_assignment_notification(
                        to_email=user['email'],
                        user_name=user['username'],
                        item_type="Work Order",
                        item_name=work_order.title,
                        assigned_by=current_user['username']
                    )
            except Exception as e:
                print(f"Failed to send notification to user {user_id}: {e}")
    
    return work_order

@api_router.get("/work-orders/{work_order_id}", response_model=WorkOrder)
async def get_work_order(work_order_id: str, current_user: dict = Depends(get_current_user)):
    work_order = await db.work_orders.find_one({"id": work_order_id}, {"_id": 0})
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    if isinstance(work_order['created_at'], str):
        work_order['created_at'] = datetime.fromisoformat(work_order['created_at'])
    if work_order.get('due_date') and isinstance(work_order['due_date'], str):
        work_order['due_date'] = datetime.fromisoformat(work_order['due_date'])
    return work_order

@api_router.put("/work-orders/{work_order_id}", response_model=WorkOrder)
async def update_work_order(work_order_id: str, work_order_data: WorkOrderUpdate, current_user: dict = Depends(get_current_user)):
    work_order = await db.work_orders.find_one({"id": work_order_id}, {"_id": 0})
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    update_data = {k: v for k, v in work_order_data.model_dump().items() if v is not None}
    if update_data.get('due_date'):
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    # Check for new user assignments
    old_assigned = set(work_order.get('assigned_to', []))
    new_assigned = set(update_data.get('assigned_to', []))
    newly_assigned = new_assigned - old_assigned
    
    if update_data:
        await db.work_orders.update_one({"id": work_order_id}, {"$set": update_data})
    
    # Send notifications to newly assigned users
    if newly_assigned:
        email_service = get_email_service()
        for user_id in newly_assigned:
            try:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user and user.get('email'):
                    await email_service.send_assignment_notification(
                        to_email=user['email'],
                        user_name=user['username'],
                        item_type="Work Order",
                        item_name=work_order['title'],
                        assigned_by=current_user['username']
                    )
            except Exception as e:
                print(f"Failed to send notification to user {user_id}: {e}")
    
    updated_work_order = await db.work_orders.find_one({"id": work_order_id}, {"_id": 0})
    if isinstance(updated_work_order['created_at'], str):
        updated_work_order['created_at'] = datetime.fromisoformat(updated_work_order['created_at'])
    if updated_work_order.get('due_date') and isinstance(updated_work_order['due_date'], str):
        updated_work_order['due_date'] = datetime.fromisoformat(updated_work_order['due_date'])
    
    return updated_work_order

@api_router.delete("/work-orders/{work_order_id}")
async def delete_work_order(work_order_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.work_orders.delete_one({"id": work_order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Work order not found")
    return {"message": "Work order deleted successfully"}

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
# API ROUTES - POLICIES/HANDBOOK
# ============================================

@api_router.get("/policies", response_model=List[Policy])
async def get_policies(current_user: dict = Depends(get_current_user)):
    policies = await db.policies.find({}, {"_id": 0}).to_list(1000)
    for policy in policies:
        if isinstance(policy.get('created_at'), str):
            policy['created_at'] = datetime.fromisoformat(policy['created_at'])
        if isinstance(policy.get('updated_at'), str):
            policy['updated_at'] = datetime.fromisoformat(policy['updated_at'])
        if policy.get('effective_date') and isinstance(policy['effective_date'], str):
            policy['effective_date'] = datetime.fromisoformat(policy['effective_date'])
    return policies

@api_router.post("/policies", response_model=Policy)
async def create_policy(policy: PolicyCreate, admin_user: dict = Depends(get_admin_user)):
    policy_dict = policy.model_dump()
    policy_dict['id'] = str(uuid.uuid4())
    policy_dict['created_by'] = admin_user['username']
    policy_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    policy_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    policy_dict['acknowledgments'] = []
    
    if policy_dict.get('effective_date'):
        policy_dict['effective_date'] = policy_dict['effective_date'].isoformat()
    
    await db.policies.insert_one(policy_dict)
    return policy_dict

@api_router.put("/policies/{policy_id}", response_model=Policy)
async def update_policy(policy_id: str, policy: PolicyUpdate, admin_user: dict = Depends(get_admin_user)):
    update_data = policy.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if update_data.get('effective_date'):
        update_data['effective_date'] = update_data['effective_date'].isoformat()
    
    result = await db.policies.update_one(
        {"id": policy_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    updated_policy = await db.policies.find_one({"id": policy_id}, {"_id": 0})
    return updated_policy

@api_router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.policies.delete_one({"id": policy_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"message": "Policy deleted successfully"}

@api_router.post("/policies/{policy_id}/acknowledge")
async def acknowledge_policy(policy_id: str, current_user: dict = Depends(get_current_user)):
    """Employee acknowledges they have read a policy"""
    policy = await db.policies.find_one({"id": policy_id}, {"_id": 0})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Check if already acknowledged
    acknowledgments = policy.get('acknowledgments', [])
    already_acknowledged = any(ack['user_id'] == current_user['id'] for ack in acknowledgments)
    
    if already_acknowledged:
        return {"message": "Policy already acknowledged"}
    
    # Add acknowledgment
    new_ack = {
        "user_id": current_user['id'],
        "user_name": current_user['username'],
        "acknowledged_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.policies.update_one(
        {"id": policy_id},
        {"$push": {"acknowledgments": new_ack}}
    )
    
    return {"message": "Policy acknowledged successfully"}

# ============================================
# API ROUTES - FLEET INSPECTIONS
# ============================================

@api_router.get("/fleet-inspections", response_model=List[FleetInspection])
async def get_fleet_inspections(current_user: dict = Depends(get_current_user)):
    inspections = await db.fleet_inspections.find({}, {"_id": 0}).to_list(1000)
    for inspection in inspections:
        if isinstance(inspection.get('created_at'), str):
            inspection['created_at'] = datetime.fromisoformat(inspection['created_at'])
        if isinstance(inspection.get('inspection_date'), str):
            inspection['inspection_date'] = datetime.fromisoformat(inspection['inspection_date'])
    return inspections

@api_router.post("/fleet-inspections", response_model=FleetInspection)
async def create_fleet_inspection(inspection: FleetInspectionCreate, current_user: dict = Depends(get_current_user)):
    """Everyone can create fleet inspection reports"""
    inspection_dict = inspection.model_dump()
    inspection_dict['id'] = str(uuid.uuid4())
    inspection_dict['created_by'] = current_user['username']
    inspection_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    if inspection_dict.get('inspection_date'):
        inspection_dict['inspection_date'] = inspection_dict['inspection_date'].isoformat()
    
    await db.fleet_inspections.insert_one(inspection_dict)
    return inspection_dict

@api_router.put("/fleet-inspections/{inspection_id}", response_model=FleetInspection)
async def update_fleet_inspection(inspection_id: str, inspection: FleetInspectionUpdate, current_user: dict = Depends(get_current_user)):
    """Everyone can update their reports, admins can update any"""
    existing = await db.fleet_inspections.find_one({"id": inspection_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Check permissions - only creator or admin can edit
    if existing['created_by'] != current_user['username'] and current_user.get('role') not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to edit this inspection")
    
    update_data = inspection.model_dump(exclude_unset=True)
    
    if update_data.get('inspection_date'):
        update_data['inspection_date'] = update_data['inspection_date'].isoformat()
    
    result = await db.fleet_inspections.update_one(
        {"id": inspection_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    updated_inspection = await db.fleet_inspections.find_one({"id": inspection_id}, {"_id": 0})
    return updated_inspection

@api_router.delete("/fleet-inspections/{inspection_id}")
async def delete_fleet_inspection(inspection_id: str, admin_user: dict = Depends(get_admin_user)):
    """Only admins/managers can delete inspections"""
    result = await db.fleet_inspections.delete_one({"id": inspection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return {"message": "Fleet inspection deleted successfully"}


# ============================================
# API ROUTES - FINANCIAL MANAGEMENT
# ============================================

# INVOICES
@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(current_user: dict = Depends(get_current_user)):
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    for invoice in invoices:
        if isinstance(invoice.get('created_at'), str):
            invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
        if invoice.get('due_date') and isinstance(invoice['due_date'], str):
            invoice['due_date'] = datetime.fromisoformat(invoice['due_date'])
    return invoices

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    invoice_dict = invoice.model_dump()
    invoice_dict['id'] = str(uuid.uuid4())
    invoice_dict['created_by'] = current_user['username']
    invoice_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    if invoice_dict.get('due_date'):
        invoice_dict['due_date'] = invoice_dict['due_date'].isoformat()
    await db.invoices.insert_one(invoice_dict)
    return invoice_dict

@api_router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, invoice: InvoiceUpdate, current_user: dict = Depends(get_current_user)):
    update_data = invoice.model_dump(exclude_unset=True)
    if update_data.get('due_date'):
        update_data['due_date'] = update_data['due_date'].isoformat()
    result = await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return await db.invoices.find_one({"id": invoice_id}, {"_id": 0})

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted successfully"}

# EXPENSES
@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: dict = Depends(get_current_user)):
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    for expense in expenses:
        if isinstance(expense.get('created_at'), str):
            expense['created_at'] = datetime.fromisoformat(expense['created_at'])
        if isinstance(expense.get('expense_date'), str):
            expense['expense_date'] = datetime.fromisoformat(expense['expense_date'])
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    expense_dict = expense.model_dump()
    expense_dict['id'] = str(uuid.uuid4())
    expense_dict['created_by'] = current_user['username']
    expense_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    if expense_dict.get('expense_date'):
        expense_dict['expense_date'] = expense_dict['expense_date'].isoformat()
    await db.expenses.insert_one(expense_dict)
    return expense_dict

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense: ExpenseUpdate, current_user: dict = Depends(get_current_user)):
    update_data = expense.model_dump(exclude_unset=True)
    if update_data.get('expense_date'):
        update_data['expense_date'] = update_data['expense_date'].isoformat()
    result = await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return await db.expenses.find_one({"id": expense_id}, {"_id": 0})

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}

# Reports Endpoints
@api_router.get("/reports", response_model=List[Report])
async def get_reports(current_user: dict = Depends(get_current_user)):
    reports = await db.reports.find({}, {"_id": 0}).to_list(length=None)
    return [Report(**report) for report in reports]

@api_router.post("/reports", response_model=Report)
async def create_report(report: ReportCreate, current_user: dict = Depends(get_current_user)):
    report_dict = report.model_dump()
    report_dict["id"] = str(uuid.uuid4())
    report_dict["created_by"] = current_user.get("username", "unknown")
    report_dict["created_at"] = datetime.now(timezone.utc)
    await db.reports.insert_one(report_dict)
    return Report(**report_dict)

@api_router.put("/reports/{report_id}", response_model=Report)
async def update_report(report_id: str, report: ReportUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in report.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.reports.update_one({"id": report_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return await db.reports.find_one({"id": report_id}, {"_id": 0})

@api_router.delete("/reports/{report_id}")
async def delete_report(report_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.reports.delete_one({"id": report_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted"}

# Compliance Endpoints
@api_router.get("/compliance", response_model=List[Compliance])
async def get_compliance(current_user: dict = Depends(get_current_user)):
    documents = await db.compliance.find({}, {"_id": 0}).to_list(length=None)
    return [Compliance(**doc) for doc in documents]

@api_router.post("/compliance", response_model=Compliance)
async def create_compliance(compliance: ComplianceCreate, current_user: dict = Depends(get_current_user)):
    compliance_dict = compliance.model_dump()
    compliance_dict["id"] = str(uuid.uuid4())
    compliance_dict["created_by"] = current_user.get("username", "unknown")
    compliance_dict["created_at"] = datetime.now(timezone.utc)
    await db.compliance.insert_one(compliance_dict)
    return Compliance(**compliance_dict)

@api_router.put("/compliance/{compliance_id}", response_model=Compliance)
async def update_compliance(compliance_id: str, compliance: ComplianceUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in compliance.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.compliance.update_one({"id": compliance_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Compliance document not found")
    return await db.compliance.find_one({"id": compliance_id}, {"_id": 0})

@api_router.delete("/compliance/{compliance_id}")
async def delete_compliance(compliance_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.compliance.delete_one({"id": compliance_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Compliance document not found")
    return {"message": "Compliance document deleted"}

# CONTRACTS (Admin/Manager only)
@api_router.get("/contracts", response_model=List[Contract])
async def get_contracts(admin_user: dict = Depends(get_admin_user)):
    contracts = await db.contracts.find({}, {"_id": 0}).to_list(1000)
    for contract in contracts:
        if isinstance(contract.get('created_at'), str):
            contract['created_at'] = datetime.fromisoformat(contract['created_at'])
        if contract.get('start_date') and isinstance(contract['start_date'], str):
            contract['start_date'] = datetime.fromisoformat(contract['start_date'])
        if contract.get('end_date') and isinstance(contract['end_date'], str):
            contract['end_date'] = datetime.fromisoformat(contract['end_date'])
    return contracts

@api_router.post("/contracts", response_model=Contract)
async def create_contract(contract: ContractCreate, admin_user: dict = Depends(get_admin_user)):
    contract_dict = contract.model_dump()
    contract_dict['id'] = str(uuid.uuid4())
    contract_dict['created_by'] = admin_user['username']
    contract_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    if contract_dict.get('start_date'):
        contract_dict['start_date'] = contract_dict['start_date'].isoformat()
    if contract_dict.get('end_date'):
        contract_dict['end_date'] = contract_dict['end_date'].isoformat()
    await db.contracts.insert_one(contract_dict)
    return contract_dict

@api_router.put("/contracts/{contract_id}", response_model=Contract)
async def update_contract(contract_id: str, contract: ContractUpdate, admin_user: dict = Depends(get_admin_user)):
    update_data = contract.model_dump(exclude_unset=True)
    if update_data.get('start_date'):
        update_data['start_date'] = update_data['start_date'].isoformat()
    if update_data.get('end_date'):
        update_data['end_date'] = update_data['end_date'].isoformat()
    result = await db.contracts.update_one({"id": contract_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    return await db.contracts.find_one({"id": contract_id}, {"_id": 0})

@api_router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.contracts.delete_one({"id": contract_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"message": "Contract deleted successfully"}

# ============================================
# API ROUTES - OPERATIONS
# ============================================

# EQUIPMENT/ASSETS
@api_router.get("/equipment", response_model=List[Equipment])
async def get_equipment(current_user: dict = Depends(get_current_user)):
    equipment = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    for item in equipment:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if item.get('purchase_date') and isinstance(item['purchase_date'], str):
            item['purchase_date'] = datetime.fromisoformat(item['purchase_date'])
    return equipment

@api_router.post("/equipment", response_model=Equipment)
async def create_equipment(equipment: EquipmentCreate, current_user: dict = Depends(get_current_user)):
    equipment_dict = equipment.model_dump()
    equipment_dict['id'] = str(uuid.uuid4())
    equipment_dict['created_by'] = current_user['username']
    equipment_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    if equipment_dict.get('purchase_date'):
        equipment_dict['purchase_date'] = equipment_dict['purchase_date'].isoformat()
    await db.equipment.insert_one(equipment_dict)
    return equipment_dict

@api_router.put("/equipment/{equipment_id}", response_model=Equipment)
async def update_equipment(equipment_id: str, equipment: EquipmentUpdate, current_user: dict = Depends(get_current_user)):
    update_data = equipment.model_dump(exclude_unset=True)
    if update_data.get('purchase_date'):
        update_data['purchase_date'] = update_data['purchase_date'].isoformat()
    result = await db.equipment.update_one({"id": equipment_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return await db.equipment.find_one({"id": equipment_id}, {"_id": 0})

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.equipment.delete_one({"id": equipment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"message": "Equipment deleted successfully"}

# TIMESHEETS
@api_router.get("/timesheets", response_model=List[Timesheet])
async def get_timesheets(current_user: dict = Depends(get_current_user)):
    timesheets = await db.timesheets.find({}, {"_id": 0}).to_list(1000)
    for timesheet in timesheets:
        if isinstance(timesheet.get('created_at'), str):
            timesheet['created_at'] = datetime.fromisoformat(timesheet['created_at'])
        if isinstance(timesheet.get('date'), str):
            timesheet['date'] = datetime.fromisoformat(timesheet['date'])
    return timesheets

@api_router.post("/timesheets", response_model=Timesheet)
async def create_timesheet(timesheet: TimesheetCreate, current_user: dict = Depends(get_current_user)):
    timesheet_dict = timesheet.model_dump()
    timesheet_dict['id'] = str(uuid.uuid4())
    timesheet_dict['created_by'] = current_user['username']
    timesheet_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    if timesheet_dict.get('date'):
        timesheet_dict['date'] = timesheet_dict['date'].isoformat()
    await db.timesheets.insert_one(timesheet_dict)
    return timesheet_dict

@api_router.put("/timesheets/{timesheet_id}", response_model=Timesheet)
async def update_timesheet(timesheet_id: str, timesheet: TimesheetUpdate, current_user: dict = Depends(get_current_user)):
    update_data = timesheet.model_dump(exclude_unset=True)
    if update_data.get('date'):
        update_data['date'] = update_data['date'].isoformat()
    result = await db.timesheets.update_one({"id": timesheet_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return await db.timesheets.find_one({"id": timesheet_id}, {"_id": 0})

@api_router.delete("/timesheets/{timesheet_id}")
async def delete_timesheet(timesheet_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.timesheets.delete_one({"id": timesheet_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    return {"message": "Timesheet deleted successfully"}

# SAFETY REPORTS
@api_router.get("/safety-reports", response_model=List[SafetyReport])
async def get_safety_reports(current_user: dict = Depends(get_current_user)):
    reports = await db.safety_reports.find({}, {"_id": 0}).to_list(1000)
    for report in reports:
        if isinstance(report.get('created_at'), str):
            report['created_at'] = datetime.fromisoformat(report['created_at'])
        if isinstance(report.get('incident_date'), str):
            report['incident_date'] = datetime.fromisoformat(report['incident_date'])
    return reports

@api_router.post("/safety-reports", response_model=SafetyReport)
async def create_safety_report(report: SafetyReportCreate, current_user: dict = Depends(get_current_user)):
    report_dict = report.model_dump()
    report_dict['id'] = str(uuid.uuid4())
    report_dict['created_by'] = current_user['username']
    report_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    if report_dict.get('incident_date'):
        report_dict['incident_date'] = report_dict['incident_date'].isoformat()
    await db.safety_reports.insert_one(report_dict)
    return report_dict

@api_router.put("/safety-reports/{report_id}", response_model=SafetyReport)
async def update_safety_report(report_id: str, report: SafetyReportUpdate, current_user: dict = Depends(get_current_user)):
    update_data = report.model_dump(exclude_unset=True)
    if update_data.get('incident_date'):
        update_data['incident_date'] = update_data['incident_date'].isoformat()
    result = await db.safety_reports.update_one({"id": report_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Safety report not found")
    return await db.safety_reports.find_one({"id": report_id}, {"_id": 0})

@api_router.delete("/safety-reports/{report_id}")
async def delete_safety_report(report_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.safety_reports.delete_one({"id": report_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Safety report not found")
    return {"message": "Safety report deleted successfully"}

# CERTIFICATIONS
@api_router.get("/certifications", response_model=List[Certification])
async def get_certifications(current_user: dict = Depends(get_current_user)):
    certifications = await db.certifications.find({}, {"_id": 0}).to_list(1000)
    for cert in certifications:
        if isinstance(cert.get('created_at'), str):
            cert['created_at'] = datetime.fromisoformat(cert['created_at'])
        if cert.get('issue_date') and isinstance(cert['issue_date'], str):
            cert['issue_date'] = datetime.fromisoformat(cert['issue_date'])
        if cert.get('expiry_date') and isinstance(cert['expiry_date'], str):
            cert['expiry_date'] = datetime.fromisoformat(cert['expiry_date'])
    return certifications

@api_router.post("/certifications", response_model=Certification)
async def create_certification(certification: CertificationCreate, current_user: dict = Depends(get_current_user)):
    cert_dict = certification.model_dump()
    cert_dict['id'] = str(uuid.uuid4())
    cert_dict['created_by'] = current_user['username']
    cert_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    if cert_dict.get('issue_date'):
        cert_dict['issue_date'] = cert_dict['issue_date'].isoformat()
    if cert_dict.get('expiry_date'):
        cert_dict['expiry_date'] = cert_dict['expiry_date'].isoformat()
    await db.certifications.insert_one(cert_dict)
    return cert_dict

@api_router.put("/certifications/{cert_id}", response_model=Certification)
async def update_certification(cert_id: str, certification: CertificationUpdate, current_user: dict = Depends(get_current_user)):
    update_data = certification.model_dump(exclude_unset=True)
    if update_data.get('issue_date'):
        update_data['issue_date'] = update_data['issue_date'].isoformat()
    if update_data.get('expiry_date'):
        update_data['expiry_date'] = update_data['expiry_date'].isoformat()
    result = await db.certifications.update_one({"id": cert_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Certification not found")
    return await db.certifications.find_one({"id": cert_id}, {"_id": 0})

@api_router.delete("/certifications/{cert_id}")
async def delete_certification(cert_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.certifications.delete_one({"id": cert_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Certification not found")
    return {"message": "Certification deleted successfully"}

# INVENTORY
@api_router.get("/inventory", response_model=List[Inventory])
async def get_inventory(current_user: dict = Depends(get_current_user)):
    inventory = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    for item in inventory:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return inventory

@api_router.post("/inventory", response_model=Inventory)
async def create_inventory(inventory: InventoryCreate, current_user: dict = Depends(get_current_user)):
    inventory_dict = inventory.model_dump()
    inventory_dict['id'] = str(uuid.uuid4())
    inventory_dict['created_by'] = current_user['username']
    inventory_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.inventory.insert_one(inventory_dict)
    return inventory_dict

@api_router.put("/inventory/{inventory_id}", response_model=Inventory)
async def update_inventory(inventory_id: str, inventory: InventoryUpdate, current_user: dict = Depends(get_current_user)):
    update_data = inventory.model_dump(exclude_unset=True)
    result = await db.inventory.update_one({"id": inventory_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return await db.inventory.find_one({"id": inventory_id}, {"_id": 0})

@api_router.delete("/inventory/{inventory_id}")
async def delete_inventory(inventory_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.inventory.delete_one({"id": inventory_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"message": "Inventory item deleted successfully"}

# DOCUMENTS
@api_router.get("/documents", response_model=List[Document])
async def get_documents(current_user: dict = Depends(get_current_user)):
    documents = await db.documents.find({}, {"_id": 0}).to_list(1000)
    for doc in documents:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return documents

@api_router.post("/documents", response_model=Document)
async def create_document(document: DocumentCreate, current_user: dict = Depends(get_current_user)):
    document_dict = document.model_dump()
    document_dict['id'] = str(uuid.uuid4())
    document_dict['created_by'] = current_user['username']
    document_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.documents.insert_one(document_dict)
    return document_dict

@api_router.put("/documents/{document_id}", response_model=Document)
async def update_document(document_id: str, document: DocumentUpdate, current_user: dict = Depends(get_current_user)):
    update_data = document.model_dump(exclude_unset=True)
    result = await db.documents.update_one({"id": document_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return await db.documents.find_one({"id": document_id}, {"_id": 0})

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}


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

# ============================================
# AI SERVICE ROUTES
# ============================================

from ai_service import get_ai_service
from pydantic import BaseModel

class AIGenerateRequest(BaseModel):
    prompt: str
    context: Optional[str] = ""

class AIAnalyzeRequest(BaseModel):
    content: str
    analysis_type: str  # summarize, risks, actions, insights

class AITaskSuggestionRequest(BaseModel):
    project_title: str
    project_description: str

class AIChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []
    current_page: Optional[str] = "Dashboard"

@api_router.post("/ai/generate")
async def ai_generate_text(request: AIGenerateRequest, current_user: dict = Depends(get_current_user)):
    """Generate text using AI"""
    ai_service = get_ai_service()
    result = await ai_service.generate_text(request.prompt, request.context)
    return {"result": result}

@api_router.post("/ai/analyze")
async def ai_analyze_document(request: AIAnalyzeRequest, current_user: dict = Depends(get_current_user)):
    """Analyze documents with AI"""
    ai_service = get_ai_service()
    result = await ai_service.analyze_document(request.content, request.analysis_type)
    return {"result": result}

@api_router.post("/ai/suggest-tasks")
async def ai_suggest_tasks(request: AITaskSuggestionRequest, current_user: dict = Depends(get_current_user)):
    """Get AI-generated task suggestions"""
    ai_service = get_ai_service()
    result = await ai_service.suggest_tasks(request.project_title, request.project_description)
    return {"result": result}

@api_router.post("/ai/categorize-expense")
async def ai_categorize_expense(expense_description: str, current_user: dict = Depends(get_current_user)):
    """Auto-categorize an expense"""
    ai_service = get_ai_service()
    result = await ai_service.categorize_expense(expense_description)
    return {"category": result}

@api_router.post("/ai/generate-invoice-description")
async def ai_generate_invoice_description(project_name: str, work_items: list, current_user: dict = Depends(get_current_user)):
    """Generate professional invoice description"""
    ai_service = get_ai_service()
    result = await ai_service.generate_invoice_description(project_name, work_items)
    return {"description": result}

@api_router.post("/ai/safety-analysis")
async def ai_safety_analysis(incident_description: str, current_user: dict = Depends(get_current_user)):
    """Analyze safety incidents"""
    ai_service = get_ai_service()
    result = await ai_service.safety_analysis(incident_description)
    return result

@api_router.post("/ai/chat")
async def ai_chat_assistant(request: AIChatRequest, current_user: dict = Depends(get_current_user)):
    """Chat with AI assistant"""
    ai_service = get_ai_service()
    user_context = {
        "user_id": current_user['id'],
        "username": current_user['username'],
        "role": current_user['role'],
        "current_page": request.current_page
    }
    result = await ai_service.chat_assistant(request.message, request.conversation_history, user_context)
    return {"response": result}

# Inventory Endpoints (Project-Based)
@api_router.get("/inventory/by-project")
async def get_inventory_by_project(current_user: dict = Depends(get_current_user)):
    """Get inventory grouped by project with totals"""
    try:
        # Get all projects
        projects = await db.projects.find({}, {"_id": 0}).to_list(length=None)
        
        result = []
        for project in projects:
            # Get inventory items for this project
            items = await db.inventory.find({"project_id": project["id"]}, {"_id": 0}).to_list(length=None)
            
            # Calculate totals
            total_items = len(items)
            total_value = sum(item.get("unit_cost", 0) * item.get("quantity", 0) for item in items)
            
            result.append({
                "project_id": project["id"],
                "project_name": project.get("name", "Unknown Project"),
                "project_status": project.get("status", "active"),
                "total_items": total_items,
                "total_value": round(total_value, 2),
                "items": items
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/inventory", response_model=List[Inventory])
async def get_inventory(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all inventory items, optionally filtered by project"""
    query = {"project_id": project_id} if project_id else {}
    items = await db.inventory.find(query, {"_id": 0}).to_list(length=None)
    return [Inventory(**item) for item in items]

@api_router.post("/inventory", response_model=Inventory)
async def create_inventory(inventory: InventoryCreate, current_user: dict = Depends(get_current_user)):
    inventory_dict = inventory.model_dump()
    inventory_dict["id"] = str(uuid.uuid4())
    inventory_dict["created_by"] = current_user.get("username", "unknown")
    inventory_dict["created_at"] = datetime.now(timezone.utc)
    await db.inventory.insert_one(prepare_for_mongo(inventory_dict))
    return Inventory(**inventory_dict)

@api_router.put("/inventory/{inventory_id}", response_model=Inventory)
async def update_inventory(inventory_id: str, inventory: InventoryUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in inventory.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.inventory.update_one({"id": inventory_id}, {"$set": prepare_for_mongo(update_data)})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return await db.inventory.find_one({"id": inventory_id}, {"_id": 0})

@api_router.delete("/inventory/{inventory_id}")
async def delete_inventory(inventory_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.inventory.delete_one({"id": inventory_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"message": "Inventory item deleted"}

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


# ============================================
# Payroll & Vendor Portal Proxy Endpoints
# ============================================

MODULES_BASE_URL = os.environ.get("MODULES_BASE_URL", "http://localhost:3001")

import httpx

async def proxy_request(
    method: str,
    path: str,
    current_user: dict,
    body: Optional[dict] = None,
    params: Optional[dict] = None
):
    """Proxy requests to Node.js modules server with user context"""
    url = f"{MODULES_BASE_URL}{path}"
    headers = {
        "X-User-ID": current_user["id"],
        "X-User-Role": current_user["role"],
        "X-User-Email": current_user["email"],
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == "GET":
            response = await client.get(url, headers=headers, params=params or {})
        elif method == "POST":
            response = await client.post(url, headers=headers, json=body or {})
        elif method == "PUT":
            response = await client.put(url, headers=headers, json=body or {})
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        else:
            raise HTTPException(status_code=405, detail="Method not allowed")
    
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    
    return response.json()

# ============================================
# PAYROLL MODULE PROXY ENDPOINTS
# ============================================

@api_router.get("/payroll/employees")
async def get_payroll_employees(current_user: dict = Depends(get_current_user)):
    """Get all payroll employees (HR/Admin only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="HR/Admin access required")
    return await proxy_request("GET", "/employees", current_user)

@api_router.post("/payroll/employees")
async def create_payroll_employee(
    employee_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create/update payroll employee (HR/Admin only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="HR/Admin access required")
    return await proxy_request("POST", "/employees", current_user, employee_data)

@api_router.get("/payroll/runs")
async def get_payroll_runs(current_user: dict = Depends(get_current_user)):
    """Get payroll runs (HR/Admin only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="HR/Admin access required")
    return await proxy_request("GET", "/payroll/runs", current_user)

@api_router.post("/payroll/run")
async def create_payroll_run(
    run_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new payroll run (HR/Admin only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="HR/Admin access required")
    return await proxy_request("POST", "/payroll/run", current_user, run_data)

@api_router.post("/payroll/calc")
async def calculate_payroll(
    calc_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Calculate payroll for a run (HR/Admin only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="HR/Admin access required")
    return await proxy_request("POST", "/payroll/calc", current_user, calc_data)

@api_router.post("/payroll/approve")
async def approve_payroll(
    approval_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Approve payroll run (HR/Admin only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="HR/Admin access required")
    return await proxy_request("POST", "/payroll/approve", current_user, approval_data)

@api_router.post("/payroll/export")
async def export_payroll(
    export_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Export payroll documents (WH-347, paystubs, NACHA) (HR/Admin only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="HR/Admin access required")
    return await proxy_request("POST", "/payroll/export", current_user, export_data)

@api_router.post("/payroll/pay")
async def process_payroll_payment(
    payment_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Process payroll payment (HR/Admin only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="HR/Admin access required")
    return await proxy_request("POST", "/payroll/pay", current_user, payment_data)

# ============================================
# VENDOR PORTAL PROXY ENDPOINTS
# ============================================

@api_router.get("/vendors")
async def get_vendors(current_user: dict = Depends(get_current_user)):
    """Get all vendors (Admin/Manager) or self (Vendor)"""
    if current_user["role"] == "vendor":
        # Vendors see only themselves
        vendor_id = current_user.get("vendor_id")
        if not vendor_id:
            raise HTTPException(status_code=404, detail="Vendor profile not found")
        return await proxy_request("GET", f"/vendors/{vendor_id}", current_user)
    elif current_user["role"] in ["admin", "manager"]:
        return await proxy_request("GET", "/vendors", current_user)
    else:
        raise HTTPException(status_code=403, detail="Access denied")

@api_router.post("/vendors")
async def create_vendor(
    vendor_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create/update vendor (Admin/Manager only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin/Manager access required")
    return await proxy_request("POST", "/vendors", current_user, vendor_data)

@api_router.get("/vendor/invoices")
async def get_vendor_invoices(current_user: dict = Depends(get_current_user)):
    """Get vendor invoices (filtered by role)"""
    if current_user["role"] == "vendor":
        vendor_id = current_user.get("vendor_id")
        if not vendor_id:
            raise HTTPException(status_code=404, detail="Vendor profile not found")
        return await proxy_request("GET", "/vendors/invoices", current_user, params={"vendor_id": vendor_id})
    elif current_user["role"] in ["admin", "manager"]:
        return await proxy_request("GET", "/vendors/invoices", current_user)
    else:
        raise HTTPException(status_code=403, detail="Access denied")

@api_router.post("/vendor/invoices")
async def submit_vendor_invoice(
    invoice_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Submit vendor invoice"""
    if current_user["role"] == "vendor":
        # Auto-set vendor_id for vendor users
        vendor_id = current_user.get("vendor_id")
        if not vendor_id:
            raise HTTPException(status_code=404, detail="Vendor profile not found")
        invoice_data["vendor_id"] = vendor_id
    return await proxy_request("POST", "/vendors/invoices", current_user, invoice_data)

@api_router.get("/vendor/payments")
async def get_vendor_payments(current_user: dict = Depends(get_current_user)):
    """Get vendor payment history (filtered by role)"""
    if current_user["role"] == "vendor":
        vendor_id = current_user.get("vendor_id")
        if not vendor_id:
            raise HTTPException(status_code=404, detail="Vendor profile not found")
        return await proxy_request("GET", "/vendors/payments", current_user, params={"vendor_id": vendor_id})
    elif current_user["role"] in ["admin", "manager"]:
        return await proxy_request("GET", "/vendors/payments", current_user)
    else:
        raise HTTPException(status_code=403, detail="Access denied")

@api_router.post("/vendor/payments")
async def process_vendor_payment(
    payment_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Process vendor payment (Admin/Manager only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin/Manager access required")
    return await proxy_request("POST", "/vendors/payments", current_user, payment_data)


# ============================================
# VENDOR INVITATION & DOCUMENT ENDPOINTS
# ============================================

import secrets
import string
from email_templates import vendor_invitation_email, vendor_document_status_email

def generate_invitation_code(length=8):
    """Generate a random invitation code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

@api_router.post("/vendors/invite")
async def invite_vendor(
    vendor_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send invitation to new vendor (Admin/Manager only)"""
    if current_user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin/Manager access required")
    
    try:
        # Generate unique invitation code
        invitation_code = generate_invitation_code()
        
        # Check if invitation code already exists
        while await db.vendor_invitations.find_one({"invitation_code": invitation_code}):
            invitation_code = generate_invitation_code()
        
        # Create invitation record
        invitation = {
            "id": str(uuid.uuid4()),
            "invitation_code": invitation_code,
            "vendor_name": vendor_data.get("name"),
            "email": vendor_data.get("email"),
            "phone": vendor_data.get("phone", ""),
            "status": "pending",
            "created_by": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
        
        await db.vendor_invitations.insert_one(invitation)
        
        # Send invitation email
        email_service = get_email_service()
        portal_url = f"{os.environ.get('FRONTEND_URL', 'https://crm-command-1.preview.emergentagent.com')}/auth?code={invitation_code}&type=vendor"
        email_content = vendor_invitation_email(
            vendor_name=vendor_data.get("name"),
            invitation_code=invitation_code,
            portal_url=portal_url
        )
        
        email_service.send_email(
            to_email=vendor_data.get("email"),
            subject=email_content["subject"],
            body=email_content["html"],
            html=True
        )
        
        return {
            "message": "Vendor invitation sent successfully",
            "invitation_code": invitation_code,
            "email": vendor_data.get("email")
        }
    except Exception as e:
        logger.error(f"Error inviting vendor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/vendor/documents")
async def get_vendor_documents(current_user: dict = Depends(get_current_user)):
    """Get vendor's company documents"""
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendor access only")
    
    vendor_id = current_user.get("vendor_id")
    if not vendor_id:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    try:
        documents = await db.vendor_documents.find(
            {"vendor_id": vendor_id},
            {"_id": 0}
        ).to_list(length=None)
        return documents
    except Exception as e:
        logger.error(f"Error fetching vendor documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vendor/documents")
async def upload_vendor_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    expiration_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload vendor company document"""
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendor access only")
    
    vendor_id = current_user.get("vendor_id")
    if not vendor_id:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    try:
        # Save file
        upload_dir = ROOT_DIR / "vendor_documents"
        upload_dir.mkdir(exist_ok=True)
        
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "pdf"
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create document record
        document = {
            "id": str(uuid.uuid4()),
            "vendor_id": vendor_id,
            "document_type": document_type,
            "file_name": file.filename,
            "stored_filename": unique_filename,
            "file_url": f"/api/vendor_documents/{unique_filename}",
            "file_size": file.size,
            "expiration_date": expiration_date,
            "notes": notes,
            "status": "pending",
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "uploaded_by": current_user["id"]
        }
        
        await db.vendor_documents.insert_one(document)
        
        # TODO: Notify admin of new document upload
        
        return {
            "message": "Document uploaded successfully",
            "document": document
        }
    except Exception as e:
        logger.error(f"Error uploading vendor document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/vendor/documents/{document_id}")
async def delete_vendor_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete vendor document"""
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendor access only")
    
    vendor_id = current_user.get("vendor_id")
    if not vendor_id:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    try:
        # Find document
        document = await db.vendor_documents.find_one(
            {"id": document_id, "vendor_id": vendor_id},
            {"_id": 0}
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete file from filesystem
        file_path = ROOT_DIR / "vendor_documents" / document["stored_filename"]
        if file_path.exists():
            file_path.unlink()
        
        # Delete from database
        await db.vendor_documents.delete_one({"id": document_id})
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting vendor document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/vendor-documents/{vendor_id}")
async def get_vendor_documents_admin(
    vendor_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Get vendor documents (Admin only)"""
    try:
        documents = await db.vendor_documents.find(
            {"vendor_id": vendor_id},
            {"_id": 0}
        ).to_list(length=None)
        return documents
    except Exception as e:
        logger.error(f"Error fetching vendor documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/vendor-documents/{document_id}/approve")
async def approve_vendor_document(
    document_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Approve vendor document (Admin only)"""
    try:
        document = await db.vendor_documents.find_one({"id": document_id}, {"_id": 0})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Update document status
        await db.vendor_documents.update_one(
            {"id": document_id},
            {"$set": {
                "status": "approved",
                "approved_by": current_user["id"],
                "approved_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Get vendor info
        vendor = await db.vendors.find_one({"id": document["vendor_id"]}, {"_id": 0})
        if vendor:
            # Send approval notification
            from email_templates import vendor_document_status_email
            email_service = get_email_service()
            email_content = vendor_document_status_email(
                vendor_name=vendor.get("name", "Vendor"),
                document_type=document["document_type"],
                status="approved"
            )
            email_service.send_email(
                to_email=vendor.get("email"),
                subject=email_content["subject"],
                body=email_content["html"],
                html=True
            )
        
        return {"message": "Document approved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/vendor-documents/{document_id}/reject")
async def reject_vendor_document(
    document_id: str,
    rejection_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Reject vendor document (Admin only)"""
    try:
        document = await db.vendor_documents.find_one({"id": document_id}, {"_id": 0})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        reason = rejection_data.get("reason", "Document does not meet requirements")
        
        # Update document status
        await db.vendor_documents.update_one(
            {"id": document_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "rejected_by": current_user["id"],
                "rejected_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Get vendor info
        vendor = await db.vendors.find_one({"id": document["vendor_id"]}, {"_id": 0})
        if vendor:
            # Send rejection notification
            from email_templates import vendor_document_status_email
            email_service = get_email_service()
            email_content = vendor_document_status_email(
                vendor_name=vendor.get("name", "Vendor"),
                document_type=document["document_type"],
                status="rejected",
                reason=reason
            )
            email_service.send_email(
                to_email=vendor.get("email"),
                subject=email_content["subject"],
                body=email_content["html"],
                html=True
            )
        
        return {"message": "Document rejected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to serve vendor documents
from fastapi.responses import FileResponse

@api_router.get("/vendor_documents/{filename}")
async def serve_vendor_document(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Serve vendor document file"""
    file_path = ROOT_DIR / "vendor_documents" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)


# ============================================
# EMPLOYEE PAYROLL DOCUMENT ENDPOINTS
# ============================================

from email_templates import employee_paystub_available_email, employee_payment_processed_email

@api_router.get("/employee/paystubs")
async def get_employee_paystubs(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get employee's paystubs"""
    try:
        query = {"employee_id": current_user["id"]}
        if year:
            query["year"] = year
        
        paystubs = await db.paystubs.find(query, {"_id": 0}).sort("pay_date", -1).to_list(length=None)
        return paystubs
    except Exception as e:
        logger.error(f"Error fetching paystubs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/employee/tax-documents")
async def get_employee_tax_documents(current_user: dict = Depends(get_current_user)):
    """Get employee's tax documents (W-2, W-4, etc.)"""
    try:
        documents = await db.employee_tax_documents.find(
            {"employee_id": current_user["id"]},
            {"_id": 0}
        ).sort("tax_year", -1).to_list(length=None)
        return documents
    except Exception as e:
        logger.error(f"Error fetching tax documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/employee/ytd-summary")
async def get_employee_ytd_summary(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get employee's YTD earnings summary"""
    try:
        current_year = year or datetime.now(timezone.utc).year
        
        # Aggregate paystubs for YTD summary
        pipeline = [
            {"$match": {
                "employee_id": current_user["id"],
                "year": current_year
            }},
            {"$group": {
                "_id": None,
                "gross": {"$sum": "$gross_pay"},
                "net": {"$sum": "$net_pay"},
                "taxes": {"$sum": "$taxes"},
                "deductions": {"$sum": "$deductions"}
            }}
        ]
        
        result = await db.paystubs.aggregate(pipeline).to_list(length=1)
        
        if result:
            return {
                "gross": result[0]["gross"],
                "net": result[0]["net"],
                "taxes": result[0]["taxes"],
                "deductions": result[0]["deductions"]
            }
        
        return {"gross": 0, "net": 0, "taxes": 0, "deductions": 0}
    except Exception as e:
        logger.error(f"Error fetching YTD summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# NOTIFICATION EVENT TRIGGERS
# ============================================

from email_templates import (
    vendor_invoice_submitted_email,
    vendor_invoice_approved_email,
    vendor_invoice_rejected_email,
    vendor_payment_approved_email,
    vendor_remittance_advice_email,
    employee_assignment_notification,
    schedule_change_notification
)

async def trigger_invoice_submitted_notification(invoice_id: str):
    """Send notification when vendor submits invoice"""
    try:
        invoice = await db.vendor_invoices.find_one({"id": invoice_id}, {"_id": 0})
        if not invoice:
            return
        
        vendor = await db.vendors.find_one({"id": invoice["vendor_id"]}, {"_id": 0})
        if not vendor:
            return
        
        email_service = get_email_service()
        email_content = vendor_invoice_submitted_email(
            vendor_name=vendor.get("name", "Vendor"),
            invoice_number=invoice["invoice_number"],
            amount=str(invoice["amount"]),
            portal_url="https://crm-command-1.preview.emergentagent.com/vendors"
        )
        
        email_service.send_email(
            to_email=vendor.get("email"),
            subject=email_content["subject"],
            body=email_content["html"],
            html=True
        )
        
        # Log notification
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": vendor.get("user_id"),
            "type": "invoice_submitted",
            "title": email_content["subject"],
            "message": f"Invoice {invoice['invoice_number']} submitted successfully",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error sending invoice submitted notification: {str(e)}")

async def trigger_invoice_status_change_notification(invoice_id: str, new_status: str, reason: str = ""):
    """Send notification when invoice status changes"""
    try:
        invoice = await db.vendor_invoices.find_one({"id": invoice_id}, {"_id": 0})
        if not invoice:
            return
        
        vendor = await db.vendors.find_one({"id": invoice["vendor_id"]}, {"_id": 0})
        if not vendor:
            return
        
        email_service = get_email_service()
        
        if new_status == "approved":
            email_content = vendor_invoice_approved_email(
                vendor_name=vendor.get("name", "Vendor"),
                invoice_number=invoice["invoice_number"],
                amount=str(invoice["amount"]),
                payment_date=invoice.get("expected_payment_date", "To be determined"),
                portal_url="https://crm-command-1.preview.emergentagent.com/vendors"
            )
        elif new_status == "rejected":
            email_content = vendor_invoice_rejected_email(
                vendor_name=vendor.get("name", "Vendor"),
                invoice_number=invoice["invoice_number"],
                amount=str(invoice["amount"]),
                reason=reason or "Please review and resubmit",
                portal_url="https://crm-command-1.preview.emergentagent.com/vendors"
            )
        else:
            return
        
        email_service.send_email(
            to_email=vendor.get("email"),
            subject=email_content["subject"],
            body=email_content["html"],
            html=True
        )
        
        # Log notification
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": vendor.get("user_id"),
            "type": f"invoice_{new_status}",
            "title": email_content["subject"],
            "message": f"Invoice {invoice['invoice_number']} has been {new_status}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error sending invoice status notification: {str(e)}")

async def trigger_payment_notification(payment_id: str, notification_type: str = "processed"):
    """Send payment notification (approved or processed)"""
    try:
        payment = await db.vendor_payments.find_one({"id": payment_id}, {"_id": 0})
        if not payment:
            return
        
        vendor = await db.vendors.find_one({"id": payment["vendor_id"]}, {"_id": 0})
        if not vendor:
            return
        
        email_service = get_email_service()
        
        # Get invoice numbers for this payment
        invoice_numbers = payment.get("invoice_numbers", [])
        
        if notification_type == "approved":
            email_content = vendor_payment_approved_email(
                vendor_name=vendor.get("name", "Vendor"),
                invoice_numbers=invoice_numbers,
                total_amount=str(payment["amount"]),
                payment_method=payment.get("method", "ACH").upper(),
                expected_date=payment.get("expected_date", "Soon")
            )
        else:  # processed
            email_content = vendor_remittance_advice_email(
                vendor_name=vendor.get("name", "Vendor"),
                invoice_numbers=invoice_numbers,
                total_amount=str(payment["amount"]),
                payment_method=payment.get("method", "ACH").upper(),
                payment_date=payment.get("payment_date", datetime.now(timezone.utc).strftime("%B %d, %Y")),
                transaction_ref=payment.get("transaction_ref", payment["id"][:12])
            )
        
        email_service.send_email(
            to_email=vendor.get("email"),
            subject=email_content["subject"],
            body=email_content["html"],
            html=True
        )
        
        # Log notification
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": vendor.get("user_id"),
            "type": f"payment_{notification_type}",
            "title": email_content["subject"],
            "message": f"Payment of ${payment['amount']} {notification_type}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error sending payment notification: {str(e)}")

async def trigger_paystub_notification(paystub_id: str):
    """Send notification when paystub is available"""
    try:
        paystub = await db.paystubs.find_one({"id": paystub_id}, {"_id": 0})
        if not paystub:
            return
        
        employee = await db.users.find_one({"id": paystub["employee_id"]}, {"_id": 0})
        if not employee:
            return
        
        email_service = get_email_service()
        email_content = employee_paystub_available_email(
            employee_name=f"{employee.get('first_name', '')} {employee.get('last_name', '')}".strip() or employee.get("username", "Employee"),
            pay_period=paystub["pay_period"],
            gross_amount=str(paystub["gross_pay"]),
            net_amount=str(paystub["net_pay"]),
            pay_date=paystub["pay_date"],
            portal_url="https://crm-command-1.preview.emergentagent.com/my-payroll-documents"
        )
        
        email_service.send_email(
            to_email=employee.get("email"),
            subject=email_content["subject"],
            body=email_content["html"],
            html=True
        )
        
        # Log notification
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": employee["id"],
            "type": "paystub_available",
            "title": email_content["subject"],
            "message": f"Paystub for {paystub['pay_period']} is ready",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error sending paystub notification: {str(e)}")

async def trigger_assignment_notification(user_id: str, item_type: str, item_id: str):
    """Send notification when user is assigned to task/project/work order"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return
        
        # Get item details based on type
        collection_map = {
            "task": "tasks",
            "project": "projects",
            "work_order": "work_orders"
        }
        
        collection = collection_map.get(item_type.lower().replace(" ", "_"))
        if not collection:
            return
        
        item = await db[collection].find_one({"id": item_id}, {"_id": 0})
        if not item:
            return
        
        assigned_by_user = await db.users.find_one({"id": item.get("created_by", "")}, {"_id": 0})
        assigned_by_name = "System"
        if assigned_by_user:
            assigned_by_name = f"{assigned_by_user.get('first_name', '')} {assigned_by_user.get('last_name', '')}".strip() or assigned_by_user.get("username", "Manager")
        
        from email_templates import employee_assignment_notification
        email_service = get_email_service()
        email_content = employee_assignment_notification(
            employee_name=f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get("username", "Employee"),
            item_type=item_type.title(),
            item_title=item.get("title", item.get("name", "Untitled")),
            assigned_by=assigned_by_name,
            due_date=item.get("due_date", item.get("deadline", "Not specified")),
            portal_url=f"https://crm-command-1.preview.emergentagent.com/{collection}"
        )
        
        email_service.send_email(
            to_email=user.get("email"),
            subject=email_content["subject"],
            body=email_content["html"],
            html=True
        )
        
        # Log notification
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "type": f"{item_type}_assigned",
            "title": email_content["subject"],
            "message": f"You have been assigned to {item_type}: {item.get('title', item.get('name', 'Untitled'))}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error sending assignment notification: {str(e)}")

# Endpoint to get user notifications
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get user's notifications"""
    try:
        notifications = await db.notifications.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(length=None)
        return notifications
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        await db.notifications.update_one(
            {"id": notification_id, "user_id": current_user["id"]},
            {"$set": {"read": True}}
        )
        return {"message": "Notification marked as read"}
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ONBOARDING ENDPOINTS
# ============================================

@api_router.post("/employee/complete-onboarding")
async def complete_employee_onboarding(
    onboarding_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Complete employee onboarding process"""
    try:
        # Update user profile
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {
                "first_name": onboarding_data.get("first_name"),
                "last_name": onboarding_data.get("last_name"),
                "phone": onboarding_data.get("phone"),
                "address": onboarding_data.get("address"),
                "city": onboarding_data.get("city"),
                "state": onboarding_data.get("state"),
                "zip": onboarding_data.get("zip"),
                "onboarding_completed": True,
                "onboarding_completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Create payroll employee record
        payroll_employee = {
            "id": str(uuid.uuid4()),
            "employee_id": current_user["id"],
            "user_id": current_user["id"],
            "first_name": onboarding_data.get("first_name"),
            "last_name": onboarding_data.get("last_name"),
            "email": onboarding_data.get("email"),
            "classification": onboarding_data.get("classification"),
            "base_rate": float(onboarding_data.get("hourly_rate", 0)),
            "fringe_rate": 0,
            "davis_bacon": onboarding_data.get("davis_bacon_certified", False),
            "ein": onboarding_data.get("ssn"),
            "routing_number": onboarding_data.get("routing_number"),
            "account_number": onboarding_data.get("account_number"),
            "bank_name": onboarding_data.get("bank_name"),
            "account_type": onboarding_data.get("account_type"),
            "start_date": onboarding_data.get("start_date"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payroll_employees.insert_one(payroll_employee)
        
        # Store W-4 information
        w4_data = {
            "id": str(uuid.uuid4()),
            "employee_id": current_user["id"],
            "filing_status": onboarding_data.get("filing_status"),
            "dependents": int(onboarding_data.get("dependents", 0)),
            "extra_withholding": float(onboarding_data.get("extra_withholding", 0)),
            "signature": onboarding_data.get("signature"),
            "signed_at": datetime.now(timezone.utc).isoformat()
        }
        await db.employee_tax_info.insert_one(w4_data)
        
        # Store NDA acceptance
        nda_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "document_type": "employee_nda",
            "accepted": onboarding_data.get("nda_accepted", False),
            "signature": onboarding_data.get("signature"),
            "signed_at": datetime.now(timezone.utc).isoformat(),
            "ip_address": "system"
        }
        await db.legal_agreements.insert_one(nda_record)
        
        # TODO: Generate W-4 PDF and store
        
        return {
            "message": "Employee onboarding completed successfully",
            "employee_id": payroll_employee["id"]
        }
    except Exception as e:
        logger.error(f"Error completing employee onboarding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vendor/complete-onboarding")
async def complete_vendor_onboarding(
    invitation_code: str = Form(...),
    company_name: str = Form(...),
    business_type: str = Form(...),
    ein: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    website: str = Form(None),
    address: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    zip: str = Form(...),
    contact_first_name: str = Form(...),
    contact_last_name: str = Form(...),
    contact_title: str = Form(...),
    contact_email: str = Form(...),
    contact_phone: str = Form(...),
    insurance_provider: str = Form(...),
    policy_number: str = Form(...),
    insurance_amount: str = Form(...),
    insurance_expiry: str = Form(...),
    bank_name: str = Form(...),
    account_type: str = Form(...),
    routing_number: str = Form(...),
    account_number: str = Form(...),
    nda_accepted: bool = Form(...),
    terms_accepted: bool = Form(...),
    signature: str = Form(...),
    w9_file: UploadFile = File(None),
    coi_file: UploadFile = File(None),
    license_file: UploadFile = File(None)
):
    """Complete vendor onboarding process"""
    try:
        # Verify invitation code
        invitation = await db.vendor_invitations.find_one({"invitation_code": invitation_code}, {"_id": 0})
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid invitation code")
        
        if invitation["status"] != "pending":
            raise HTTPException(status_code=400, detail="Invitation already used")
        
        # Create user account for vendor
        hashed_password = pwd_context.hash("TempPassword123!")  # Temporary password
        user = {
            "id": str(uuid.uuid4()),
            "username": email,
            "email": email,
            "password": hashed_password,
            "role": "vendor",
            "first_name": contact_first_name,
            "last_name": contact_last_name,
            "onboarding_completed": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        
        # Create vendor profile
        vendor = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "name": company_name,
            "business_type": business_type,
            "ein": ein,
            "phone": phone,
            "email": email,
            "website": website,
            "address": address,
            "city": city,
            "state": state,
            "zip": zip,
            "contact_first_name": contact_first_name,
            "contact_last_name": contact_last_name,
            "contact_title": contact_title,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "insurance_provider": insurance_provider,
            "policy_number": policy_number,
            "insurance_amount": insurance_amount,
            "insurance_expires": insurance_expiry,
            "bank_name": bank_name,
            "account_type": account_type,
            "routing_number": routing_number,
            "account_number": account_number,
            "status": "pending_approval",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.vendors.insert_one(vendor)
        
        # Update user with vendor_id
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"vendor_id": vendor["id"]}}
        )
        
        # Save uploaded documents
        upload_dir = ROOT_DIR / "vendor_documents"
        upload_dir.mkdir(exist_ok=True)
        
        if w9_file:
            file_path = upload_dir / f"{vendor['id']}_w9_{w9_file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(w9_file.file, buffer)
            
            doc_record = {
                "id": str(uuid.uuid4()),
                "vendor_id": vendor["id"],
                "document_type": "w9",
                "file_name": w9_file.filename,
                "stored_filename": f"{vendor['id']}_w9_{w9_file.filename}",
                "file_url": f"/api/vendor_documents/{vendor['id']}_w9_{w9_file.filename}",
                "status": "pending",
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
            await db.vendor_documents.insert_one(doc_record)
        
        if coi_file:
            file_path = upload_dir / f"{vendor['id']}_coi_{coi_file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(coi_file.file, buffer)
            
            doc_record = {
                "id": str(uuid.uuid4()),
                "vendor_id": vendor["id"],
                "document_type": "coi",
                "file_name": coi_file.filename,
                "stored_filename": f"{vendor['id']}_coi_{coi_file.filename}",
                "file_url": f"/api/vendor_documents/{vendor['id']}_coi_{coi_file.filename}",
                "expiration_date": insurance_expiry,
                "status": "pending",
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
            await db.vendor_documents.insert_one(doc_record)
        
        if license_file:
            file_path = upload_dir / f"{vendor['id']}_license_{license_file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(license_file.file, buffer)
            
            doc_record = {
                "id": str(uuid.uuid4()),
                "vendor_id": vendor["id"],
                "document_type": "license",
                "file_name": license_file.filename,
                "stored_filename": f"{vendor['id']}_license_{license_file.filename}",
                "file_url": f"/api/vendor_documents/{vendor['id']}_license_{license_file.filename}",
                "status": "pending",
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
            await db.vendor_documents.insert_one(doc_record)
        
        # Store NDA acceptance
        nda_record = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "vendor_id": vendor["id"],
            "document_type": "vendor_nda",
            "accepted": nda_accepted,
            "terms_accepted": terms_accepted,
            "signature": signature,
            "signed_at": datetime.now(timezone.utc).isoformat()
        }
        await db.legal_agreements.insert_one(nda_record)
        
        # Mark invitation as used
        await db.vendor_invitations.update_one(
            {"invitation_code": invitation_code},
            {"$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "vendor_id": vendor["id"]
            }}
        )
        
        # TODO: Send welcome email to vendor
        
        return {
            "message": "Vendor onboarding completed successfully",
            "vendor_id": vendor["id"],
            "user_id": user["id"],
            "temp_password": "TempPassword123!"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing vendor onboarding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Form Assist endpoint
@api_router.post("/ai/form-assist")
async def ai_form_assist(
    assist_request: dict,
    current_user: dict = Depends(get_current_user)
):
    """AI-assisted form filling"""
    try:
        from emergentintegrations import LLM
        
        llm = LLM(api_key=os.environ.get("EMERGENT_LLM_KEY"))
        
        section = assist_request.get("section")
        current_data = assist_request.get("current_data", {})
        form_type = assist_request.get("form_type")
        
        prompt = f"""You are helping fill out a {form_type} form.
Section: {section}
Current data: {current_data}

Provide intelligent suggestions for missing or incomplete fields based on common patterns and best practices.
Return suggestions as a JSON object with field names as keys.

Only suggest for fields that are empty or obviously incorrect.
"""
        
        response = llm.text_generation(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse AI response
        # For now, return empty suggestions (AI integration can be enhanced)
        return {"suggestions": {}}
    except Exception as e:
        logger.error(f"Error with AI form assist: {str(e)}")
        return {"suggestions": {}}

        
        assigned_by_user = await db.users.find_one({"id": item.get("created_by", "")}, {"_id": 0})
        assigned_by_name = "System"
        if assigned_by_user:
            assigned_by_name = f"{assigned_by_user.get('first_name', '')} {assigned_by_user.get('last_name', '')}".strip() or assigned_by_user.get("username", "Manager")
        
        email_service = get_email_service()
        email_content = employee_assignment_notification(
            employee_name=f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get("username", "Employee"),
            item_type=item_type.title(),
            item_title=item.get("title", item.get("name", "Untitled")),
            assigned_by=assigned_by_name,
            due_date=item.get("due_date", item.get("deadline", "Not specified")),
            portal_url=f"https://crm-command-1.preview.emergentagent.com/{collection}"
        )
        
        email_service.send_email(
            to_email=user.get("email"),
            subject=email_content["subject"],
            body=email_content["html"],
            html=True
        )
        
        # Log notification
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "type": f"{item_type}_assigned",
            "title": email_content["subject"],
            "message": f"You have been assigned to {item_type}: {item.get('title', item.get('name', 'Untitled'))}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error sending assignment notification: {str(e)}")

# Endpoint to get user notifications
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get user's notifications"""
    try:
        notifications = await db.notifications.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(50).to_list(length=None)
        return notifications
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        await db.notifications.update_one(
            {"id": notification_id, "user_id": current_user["id"]},
            {"$set": {"read": True}}
        )
        return {"message": "Notification marked as read"}
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

        # Update document status
        await db.vendor_documents.update_one(
            {"id": document_id},
            {"$set": {
                "status": "approved",
                "approved_by": current_user["id"],
                "approved_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Get vendor info
        vendor = await db.vendors.find_one({"id": document["vendor_id"]}, {"_id": 0})
        if vendor:
            # Send approval notification
            email_service = get_email_service()
            email_content = vendor_document_status_email(
                vendor_name=vendor.get("name", "Vendor"),
                document_type=document["document_type"],
                status="approved"
            )
            email_service.send_email(
                to_email=vendor.get("email"),
                subject=email_content["subject"],
                body=email_content["html"],
                html=True
            )
        
        return {"message": "Document approved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/vendor-documents/{document_id}/reject")
async def reject_vendor_document(
    document_id: str,
    rejection_data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Reject vendor document (Admin only)"""
    try:
        document = await db.vendor_documents.find_one({"id": document_id}, {"_id": 0})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        reason = rejection_data.get("reason", "Document does not meet requirements")
        
        # Update document status
        await db.vendor_documents.update_one(
            {"id": document_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "rejected_by": current_user["id"],
                "rejected_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Get vendor info
        vendor = await db.vendors.find_one({"id": document["vendor_id"]}, {"_id": 0})
        if vendor:
            # Send rejection notification
            email_service = get_email_service()
            email_content = vendor_document_status_email(
                vendor_name=vendor.get("name", "Vendor"),
                document_type=document["document_type"],
                status="rejected",
                reason=reason
            )
            email_service.send_email(
                to_email=vendor.get("email"),
                subject=email_content["subject"],
                body=email_content["html"],
                html=True
            )
        
        return {"message": "Document rejected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to serve vendor documents
from fastapi.responses import FileResponse

@api_router.get("/vendor_documents/{filename}")
async def serve_vendor_document(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Serve vendor document file"""
    file_path = ROOT_DIR / "vendor_documents" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
