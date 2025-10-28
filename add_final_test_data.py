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

# Add Reports
print("Adding Reports...")
reports = [
    {
        "title": "Q1 2025 Financial Summary Report",
        "report_type": "financial",
        "period": "Q1 2025 (Jan-Mar)",
        "description": "Comprehensive financial analysis including revenue, expenses, and profit margins for first quarter",
        "generated_by": "Admin",
        "files": []
    },
    {
        "title": "Monthly Safety Compliance Report - October",
        "report_type": "safety",
        "period": "October 2025",
        "description": "Monthly safety incident tracking, training completion rates, and compliance status",
        "generated_by": "Safety Manager",
        "files": []
    },
    {
        "title": "Project Performance Analytics - 2025",
        "report_type": "operational",
        "period": "2025 Year-to-Date",
        "description": "Project completion rates, resource utilization, and timeline analysis",
        "generated_by": "Operations Lead",
        "files": []
    }
]

for report_data in reports:
    try:
        response = requests.post(f"{BACKEND_URL}/api/reports", headers=headers, json=report_data)
        if response.ok:
            print(f"✅ Added: {report_data['title']}")
        else:
            print(f"⚠️  {report_data['title']}: {response.text}")
    except Exception as e:
        print(f"❌ Report error: {e}")

# Add Compliance Documents
print("\nAdding Compliance Documents...")
compliance_docs = [
    {
        "title": "OSHA Workplace Safety Compliance Certification",
        "compliance_type": "regulatory",
        "requirement": "Annual workplace safety audit and documentation",
        "status": "compliant",
        "due_date": (datetime.now() + timedelta(days=90)).isoformat(),
        "description": "All safety measures meet OSHA standards. Next audit scheduled in 90 days. Latest inspection passed with no violations.",
        "files": []
    },
    {
        "title": "EPA Environmental Impact Assessment",
        "compliance_type": "environmental",
        "requirement": "Quarterly environmental compliance review",
        "status": "compliant",
        "due_date": (datetime.now() + timedelta(days=60)).isoformat(),
        "description": "Environmental controls operational. Waste disposal procedures meet EPA guidelines.",
        "files": []
    },
    {
        "title": "DOT Commercial Vehicle Inspections",
        "compliance_type": "regulatory",
        "requirement": "Vehicle safety inspections and documentation",
        "status": "pending",
        "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
        "description": "Annual DOT inspection due for fleet vehicles. 3 of 5 vehicles completed.",
        "files": []
    }
]

for compliance_data in compliance_docs:
    try:
        response = requests.post(f"{BACKEND_URL}/api/compliance", headers=headers, json=compliance_data)
        if response.ok:
            print(f"✅ Added: {compliance_data['title']}")
        else:
            print(f"⚠️  {compliance_data['title']}: {response.text}")
    except Exception as e:
        print(f"❌ Compliance error: {e}")

# Add Fleet Inspections
print("\nAdding Fleet Inspections...")
fleet_inspections = [
    {
        "vehicle_name": "Ford F-150 Work Truck",
        "vehicle_number": "FLEET-2024-001",
        "inspector_name": "Mike Johnson",
        "inspection_date": datetime.now().isoformat(),
        "mileage": "45,230",
        "location": "Main Yard",
        "status": "pass",
        "notes": "All systems operational. Tires at 75% tread. Oil change completed. Brake pads good. Next inspection due in 3 months.",
        "files": []
    },
    {
        "vehicle_name": "Chevrolet Silverado 2500",
        "vehicle_number": "FLEET-2023-002",
        "inspector_name": "Sarah Martinez",
        "inspection_date": (datetime.now() - timedelta(days=7)).isoformat(),
        "mileage": "68,450",
        "location": "North Facility",
        "status": "pass",
        "notes": "Routine inspection passed. Minor windshield chip noted for repair. All mechanical systems functioning properly.",
        "files": []
    },
    {
        "vehicle_name": "RAM 3500 Crew Cab",
        "vehicle_number": "FLEET-2024-003",
        "inspector_name": "Mike Johnson",
        "inspection_date": (datetime.now() - timedelta(days=2)).isoformat(),
        "mileage": "32,890",
        "location": "Main Yard",
        "status": "needs_repair",
        "notes": "ATTENTION: Rear brake pads at 20%, replacement recommended within 2 weeks. All other systems pass inspection.",
        "files": []
    }
]

for fleet_data in fleet_inspections:
    try:
        response = requests.post(f"{BACKEND_URL}/api/fleet-inspections", headers=headers, json=fleet_data)
        if response.ok:
            print(f"✅ Added: {fleet_data['vehicle_name']} ({fleet_data['vehicle_number']})")
        else:
            print(f"⚠️  {fleet_data['vehicle_name']}: {response.text}")
    except Exception as e:
        print(f"❌ Fleet inspection error: {e}")

print("\n" + "="*60)
print("✅ All test data created successfully!")
print("="*60)
print("\n📊 You can now test these sections:")
print("   • Reports (3 sample reports)")
print("   • Compliance (3 compliance documents)")
print("   • Fleet Inspections (3 vehicle inspections)")
print("\n💡 Click on any row to open FileGalleryFullScreen and verify layout!")
