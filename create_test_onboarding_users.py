"""
Create test employee and vendor users for onboarding testing
"""
import sys
sys.path.append('/app/backend')
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_users():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['crm_db']
    
    print("Creating test users for onboarding...")
    print("=" * 60)
    
    # 1. Create test EMPLOYEE for employee onboarding
    employee_email = "john.smith@williamsdiverse.com"
    employee_password = "Employee123!"
    
    # Check if employee already exists
    existing_employee = await db.users.find_one({"email": employee_email})
    if existing_employee:
        print(f"\n⚠️  Employee {employee_email} already exists. Deleting...")
        await db.users.delete_one({"email": employee_email})
    
    employee_user = {
        "id": str(uuid.uuid4()),
        "username": "john.smith",
        "email": employee_email,
        "password_hash": pwd_context.hash(employee_password),
        "role": "employee",
        "first_name": "",  # Empty - will be filled during onboarding
        "last_name": "",
        "onboarding_completed": False,  # KEY: This triggers onboarding redirect
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(employee_user)
    
    print(f"\n✅ TEST EMPLOYEE CREATED:")
    print(f"   Email: {employee_email}")
    print(f"   Password: {employee_password}")
    print(f"   Status: Needs Onboarding")
    print(f"   Login URL: https://williams-portal.preview.emergentagent.com/auth")
    
    # 2. Create VENDOR INVITATION for vendor onboarding
    vendor_email = "contact@acmeconstruction.com"
    invitation_code = "VENDOR2025"
    
    # Check if invitation already exists
    existing_invitation = await db.vendor_invitations.find_one({"invitation_code": invitation_code})
    if existing_invitation:
        print(f"\n⚠️  Invitation code {invitation_code} already exists. Deleting...")
        await db.vendor_invitations.delete_one({"invitation_code": invitation_code})
    
    from datetime import timedelta
    invitation = {
        "id": str(uuid.uuid4()),
        "invitation_code": invitation_code,
        "vendor_name": "ACME Construction LLC",
        "email": vendor_email,
        "phone": "(555) 987-6543",
        "status": "pending",
        "created_by": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    }
    
    await db.vendor_invitations.insert_one(invitation)
    
    print(f"\n✅ TEST VENDOR INVITATION CREATED:")
    print(f"   Company: ACME Construction LLC")
    print(f"   Email: {vendor_email}")
    print(f"   Invitation Code: {invitation_code}")
    print(f"   Onboarding URL: https://williams-portal.preview.emergentagent.com/vendor-onboarding?code={invitation_code}")
    
    print("\n" + "=" * 60)
    print("✅ Test users created successfully!")
    print("=" * 60)
    
    client.close()

asyncio.run(create_test_users())
