from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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
    
    # Send invitation email
    try:
        # Get notification settings for email configuration
        notification_settings = await db.notification_settings.find_one({}, {"_id": 0})
        
        if notification_settings and notification_settings.get('smtp_server'):
            # Create registration link - using frontend URL
            frontend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000').replace('/api', '')
            registration_link = f"{frontend_url}/auth?invite={invitation_code}"
            
            # Email subject and body
            subject = f"Invitation to Join Williams Diversified LLC - Project Command Center"
            body = f"""
Hello,

You have been invited to join Williams Diversified LLC's Project Command Center.

Your invitation details:
- Role: {invitation_data.role.upper()}
- Invitation Code: {invitation_code}
- Expires: {datetime.fromisoformat(invitation_dict['expires_at']).strftime('%B %d, %Y at %I:%M %p')}

To complete your registration, please click the link below:
{registration_link}

Or visit the registration page and enter the invitation code: {invitation_code}

If you have any questions, please contact your administrator.

Best regards,
Williams Diversified LLC Team

---
This invitation will expire in 7 days.
"""
            
            # Send email using email service
            await email_service.send_email(
                to_email=invitation_data.email,
                subject=subject,
                body=body,
                smtp_config={
                    'server': notification_settings.get('smtp_server'),
                    'port': notification_settings.get('smtp_port', 587),
                    'username': notification_settings.get('smtp_username'),
                    'password': notification_settings.get('smtp_password'),
                    'from_email': notification_settings.get('admin_email', notification_settings.get('smtp_username'))
                }
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
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
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
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
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
    work_orders = await db.work_orders.find({}, {"_id": 0}).to_list(length=None)
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
