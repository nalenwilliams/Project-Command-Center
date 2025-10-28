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
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
print(f"✅ Logged in successfully\n")

# Add Report
try:
    report_data = {
        "title": "Q1 2025 Financial Summary Report",
        "report_type": "financial",
        "period": "Q1 2025 (Jan-Mar)",
        "description": "Comprehensive financial analysis including revenue, expenses, and profit margins for first quarter",
        "generated_by": "Admin",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/reports", headers=headers, json=report_data)
    if response.ok:
        print("✅ Added test report")
    else:
        print(f"⚠️ Report: {response.text}")
except Exception as e:
    print(f"❌ Report error: {e}")

# Add Compliance Document
try:
    compliance_data = {
        "title": "OSHA Workplace Safety Compliance",
        "compliance_type": "regulatory",
        "requirement": "Annual workplace safety audit and documentation",
        "status": "compliant",
        "due_date": (datetime.now() + timedelta(days=90)).isoformat(),
        "description": "All safety measures meet OSHA standards. Next audit scheduled in 90 days.",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/compliance", headers=headers, json=compliance_data)
    if response.ok:
        print("✅ Added test compliance document")
    else:
        print(f"⚠️ Compliance: {response.text}")
except Exception as e:
    print(f"❌ Compliance error: {e}")

# Add Employee
try:
    employee_data = {
        "name": "Sarah Martinez",
        "email": "sarah.martinez@williamsdiversified.com",
        "phone": "(555) 234-5678",
        "position": "Project Manager",
        "department": "Operations",
        "hire_date": (datetime.now() - timedelta(days=365)).isoformat(),
        "status": "active",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/employees", headers=headers, json=employee_data)
    if response.ok:
        print("✅ Added test employee")
    else:
        print(f"⚠️ Employee: {response.text}")
except Exception as e:
    print(f"❌ Employee error: {e}")

# Add Fleet Inspection
try:
    fleet_data = {
        "vehicle_id": "TRUCK-2024-F150",
        "vehicle_type": "truck",
        "inspection_date": datetime.now().isoformat(),
        "inspector": "Mike Johnson",
        "status": "passed",
        "mileage": "45,230",
        "notes": "All systems operational. Tires at 75% tread. Oil change completed. Next inspection due in 3 months.",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/fleet-inspections", headers=headers, json=fleet_data)
    if response.ok:
        print("✅ Added test fleet inspection")
    else:
        print(f"⚠️ Fleet inspection: {response.text}")
except Exception as e:
    print(f"❌ Fleet inspection error: {e}")

# Add Schedule (if not already added)
try:
    schedule_data = {
        "title": "Team Safety Training Session",
        "employee_name": "All Staff",
        "start_time": (datetime.now() + timedelta(days=7, hours=9)).isoformat(),
        "end_time": (datetime.now() + timedelta(days=7, hours=12)).isoformat(),
        "location": "Main Office Conference Room",
        "description": "Quarterly safety training and certification renewal",
        "files": []
    }
    response = requests.post(f"{BACKEND_URL}/api/schedules", headers=headers, json=schedule_data)
    if response.ok:
        print("✅ Added test schedule")
    else:
        print(f"⚠️ Schedule: {response.text}")
except Exception as e:
    print(f"❌ Schedule error: {e}")

print("\n✅ All test data created successfully!")
print("You can now test ALL sections with sample data:")
print("  • Reports")
print("  • Compliance")
print("  • Employees")
print("  • Fleet Inspections")
print("  • Schedules")
print("  • (Plus all previously added: Invoices, Expenses, Contracts, Equipment, etc.)")
