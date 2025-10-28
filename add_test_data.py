#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

# Get backend URL
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if 'REACT_APP_BACKEND_URL' in line:
            BACKEND_URL = line.split('=')[1].strip()
            break

print(f"Backend URL: {BACKEND_URL}")

# Login as admin
login_response = requests.post(
    f"{BACKEND_URL}/api/auth/login",
    json={"username": "admin", "password": "Admin123!"}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.text}")
    exit(1)

login_data = login_response.json()
token = login_data.get('token') or login_data.get('access_token')
if not token:
    print(f"❌ No token in response: {login_data}")
    exit(1)

headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
print(f"✅ Logged in successfully")

# Get existing data to avoid duplicates
try:
    clients_response = requests.get(f"{BACKEND_URL}/api/clients", headers=headers)
    clients = clients_response.json() if clients_response.ok else []
    
    projects_response = requests.get(f"{BACKEND_URL}/api/projects", headers=headers)
    projects = projects_response.json() if projects_response.ok else []
    
    users_response = requests.get(f"{BACKEND_URL}/api/users", headers=headers)
    users = users_response.json() if users_response.ok else []
    
    client_id = clients[0]['id'] if clients else None
    project_id = projects[0]['id'] if projects else None
    user_id = users[0]['id'] if len(users) > 0 else None
    
    print(f"✅ Found {len(clients)} clients, {len(projects)} projects, {len(users)} users")
except Exception as e:
    print(f"Warning getting existing data: {e}")
    client_id = None
    project_id = None
    user_id = None

# Add Invoice
try:
    invoice_data = {
        "invoice_number": "INV-2025-001",
        "client_id": client_id,
        "project_id": project_id,
        "amount": 5500.00,
        "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
        "status": "sent",
        "notes": "Project completion invoice with materials and labor",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/invoices", headers=headers, json=invoice_data)
    if response.ok:
        print("✅ Added test invoice")
    else:
        print(f"⚠️ Invoice: {response.text}")
except Exception as e:
    print(f"❌ Invoice error: {e}")

# Add Expense
try:
    expense_data = {
        "description": "Construction Materials - Lumber and Hardware",
        "amount": 1250.75,
        "category": "materials",
        "project_id": project_id,
        "expense_date": datetime.now().isoformat(),
        "receipt_number": "RCP-2025-001",
        "notes": "Home Depot purchase for framing materials",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/expenses", headers=headers, json=expense_data)
    if response.ok:
        print("✅ Added test expense")
    else:
        print(f"⚠️ Expense: {response.text}")
except Exception as e:
    print(f"❌ Expense error: {e}")

# Add Contract
try:
    contract_data = {
        "title": "Annual Maintenance Agreement",
        "client_id": client_id,
        "contract_number": "CNT-2025-001",
        "value": 15000.00,
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=365)).isoformat(),
        "status": "active",
        "notes": "Full service maintenance contract including quarterly inspections",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/contracts", headers=headers, json=contract_data)
    if response.ok:
        print("✅ Added test contract")
    else:
        print(f"⚠️ Contract: {response.text}")
except Exception as e:
    print(f"❌ Contract error: {e}")

# Add Equipment
try:
    equipment_data = {
        "name": "Hydraulic Lift - 20ft",
        "equipment_type": "heavy_equipment",
        "serial_number": "SN-2024-HL-8856",
        "location": "Main Warehouse - Bay 3",
        "assigned_to": "Equipment Pool",
        "purchase_date": (datetime.now() - timedelta(days=180)).isoformat(),
        "status": "available",
        "notes": "Regular maintenance completed 2 weeks ago. Next service due in 3 months.",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/equipment", headers=headers, json=equipment_data)
    if response.ok:
        print("✅ Added test equipment")
    else:
        print(f"⚠️ Equipment: {response.text}")
except Exception as e:
    print(f"❌ Equipment error: {e}")

# Add Timesheet
try:
    timesheet_data = {
        "employee_name": "John Smith",
        "date": datetime.now().isoformat(),
        "hours_worked": 8.5,
        "project_id": project_id,
        "notes": "Completed framing work on main structure",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/timesheets", headers=headers, json=timesheet_data)
    if response.ok:
        print("✅ Added test timesheet")
    else:
        print(f"⚠️ Timesheet: {response.text}")
except Exception as e:
    print(f"❌ Timesheet error: {e}")

# Add Inventory Item
try:
    inventory_data = {
        "item_name": "2x4 Lumber - 8ft",
        "quantity": 250,
        "unit": "pieces",
        "location": "Warehouse A - Section 12",
        "reorder_level": 50,
        "notes": "Premium grade Douglas Fir",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/inventory", headers=headers, json=inventory_data)
    if response.ok:
        print("✅ Added test inventory item")
    else:
        print(f"⚠️ Inventory: {response.text}")
except Exception as e:
    print(f"❌ Inventory error: {e}")

# Add Safety Report
try:
    safety_data = {
        "title": "Weekly Safety Inspection Report",
        "severity": "low",
        "location": "Construction Site - Main Building",
        "reported_by": "Safety Officer",
        "incident_date": datetime.now().isoformat(),
        "description": "Routine weekly safety inspection completed. Minor PPE compliance issues addressed on-site.",
        "status": "resolved",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/safety-reports", headers=headers, json=safety_data)
    if response.ok:
        print("✅ Added test safety report")
    else:
        print(f"⚠️ Safety report: {response.text}")
except Exception as e:
    print(f"❌ Safety report error: {e}")

# Add Certification
try:
    cert_data = {
        "name": "OSHA 30-Hour Construction Safety",
        "employee_name": "Mike Johnson",
        "issue_date": (datetime.now() - timedelta(days=90)).isoformat(),
        "expiry_date": (datetime.now() + timedelta(days=1005)).isoformat(),
        "issuing_authority": "OSHA",
        "certification_number": "OSHA-30-2024-8765",
        "notes": "Completed with honors. Includes fall protection and scaffolding modules.",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/certifications", headers=headers, json=cert_data)
    if response.ok:
        print("✅ Added test certification")
    else:
        print(f"⚠️ Certification: {response.text}")
except Exception as e:
    print(f"❌ Certification error: {e}")

# Add Policy
try:
    policy_data = {
        "title": "Safety Equipment Usage Policy",
        "description": "All employees must wear appropriate PPE at all times on job sites including hard hats, safety glasses, and steel-toed boots.",
        "category": "safety",
        "version": "2.0",
        "effective_date": datetime.now().isoformat(),
        "requires_acknowledgment": True,
        "file_url": ""
    }
    response = requests.post(f"{BACKEND_URL}/api/policies", headers=headers, json=policy_data)
    if response.ok:
        print("✅ Added test policy")
    else:
        print(f"⚠️ Policy: {response.text}")
except Exception as e:
    print(f"❌ Policy error: {e}")

print("\n✅ Test data creation complete!")
print("You can now view and test all sections with sample data.")
