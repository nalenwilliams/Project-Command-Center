#!/usr/bin/env python3
"""
Check vendor invitations in MongoDB database
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

async def check_vendor_invitations():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Checking vendor invitations in database...")
    print("=" * 60)
    
    # Get all vendor invitations
    invitations = await db.vendor_invitations.find({}, {"_id": 0}).to_list(1000)
    
    print(f"📋 Found {len(invitations)} vendor invitations:")
    print()
    
    for inv in invitations:
        code = inv.get("invitation_code", "N/A")
        status = inv.get("status", "N/A")
        email = inv.get("email", "N/A")
        created_at = inv.get("created_at", "N/A")
        expires_at = inv.get("expires_at", "N/A")
        
        # Check if expired
        is_expired = False
        if expires_at != "N/A":
            try:
                expire_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                is_expired = expire_date < datetime.now(timezone.utc)
            except:
                pass
        
        print(f"Code: {code}")
        print(f"  Status: {status}")
        print(f"  Email: {email}")
        print(f"  Created: {created_at}")
        print(f"  Expires: {expires_at}")
        print(f"  Is Expired: {is_expired}")
        print()
    
    # Look specifically for VENDOR2025
    vendor2025 = await db.vendor_invitations.find_one({"invitation_code": "VENDOR2025"}, {"_id": 0})
    
    if vendor2025:
        print("🎯 VENDOR2025 FOUND:")
        print("=" * 30)
        for key, value in vendor2025.items():
            print(f"{key}: {value}")
        
        # Check if expired
        expires_at = vendor2025.get("expires_at")
        if expires_at:
            try:
                expire_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                is_expired = expire_date < datetime.now(timezone.utc)
                print(f"Is Expired: {is_expired}")
                print(f"Current Time: {datetime.now(timezone.utc).isoformat()}")
            except Exception as e:
                print(f"Error checking expiration: {e}")
    else:
        print("❌ VENDOR2025 NOT FOUND in database")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(check_vendor_invitations())