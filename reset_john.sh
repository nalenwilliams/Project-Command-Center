#!/bin/bash
# Quick script to reset John Smith's account for testing

cat > /tmp/quick_reset_john.py << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def reset_john():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client.crm_db
    
    john = await db.users.find_one({"email": "john.smith@williamsdiverse.com"})
    
    if john:
        user_id = john['id']
        
        # Reset onboarding status
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "onboarding_completed": False,
                "first_name": "",
                "last_name": "",
                "phone": None,
                "address": None,
                "city": None,
                "state": None,
                "zip": None
            },
            "$unset": {"onboarding_completed_at": ""}}
        )
        
        # Delete related records
        await db.payroll_employees.delete_many({"employee_id": user_id})
        await db.payroll_employees.delete_many({"email": "john.smith@williamsdiverse.com"})
        await db.employee_tax_info.delete_many({"employee_id": user_id})
        await db.legal_agreements.delete_many({"user_id": user_id})
        
        print("✅ John Smith reset successfully!")
        print("   Login: john.smith / Employee123!")
        print("   URL: https://crm-command-1.preview.emergentagent.com/auth")
    else:
        print("❌ John Smith not found")
    
    client.close()

asyncio.run(reset_john())
EOF

python /tmp/quick_reset_john.py
