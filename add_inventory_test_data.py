#!/usr/bin/env python3
import requests

# Get backend URL
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if 'REACT_APP_BACKEND_URL' in line:
            BACKEND_URL = line.split('=')[1].strip()
            break

print(f"Backend URL: {BACKEND_URL}")

# Login
login_response = requests.post(f"{BACKEND_URL}/api/auth/login", json={"username": "admin", "password": "Admin123!"})
token = login_response.json().get('token') or login_response.json().get('access_token')
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
print("✅ Logged in\n")

# Get projects
projects_response = requests.get(f"{BACKEND_URL}/api/projects", headers=headers)
projects = projects_response.json()

if not projects:
    print("❌ No projects found. Please create projects first.")
    exit(1)

project = projects[0]
print(f"Adding inventory to project: {project['name']}\n")

# Add inventory items
inventory_items = [
    {
        "item_name": "2x4 Lumber - 8ft",
        "category": "materials",
        "quantity": 250,
        "unit": "pieces",
        "project_id": project['id'],
        "location": "Main Warehouse - Section A",
        "unit_cost": 6.50,
        "supplier": "Home Depot",
        "notes": "Premium grade Douglas Fir for framing"
    },
    {
        "item_name": "Drywall Sheets - 4x8",
        "category": "materials",
        "quantity": 120,
        "unit": "sheets",
        "project_id": project['id'],
        "location": "Job Site Storage",
        "unit_cost": 12.75,
        "supplier": "Lowe's",
        "notes": "1/2 inch thickness standard drywall"
    },
    {
        "item_name": "Concrete Mix - 80lb",
        "category": "materials",
        "quantity": 75,
        "unit": "bags",
        "project_id": project['id'],
        "location": "Warehouse - Dry Storage",
        "unit_cost": 8.25,
        "supplier": "Builder's Supply",
        "notes": "Fast-setting concrete mix"
    },
    {
        "item_name": "Paint - Interior Eggshell White",
        "category": "supplies",
        "quantity": 30,
        "unit": "gallons",
        "project_id": project['id'],
        "location": "Paint Storage Room",
        "unit_cost": 35.00,
        "supplier": "Sherwin Williams",
        "notes": "Premium interior paint with primer"
    },
    {
        "item_name": "Nails - 16d Common",
        "category": "supplies",
        "quantity": 15,
        "unit": "boxes",
        "project_id": project['id'],
        "location": "Tool Crib - Bin 12",
        "unit_cost": 18.50,
        "supplier": "Fastenal",
        "notes": "50 lb boxes, galvanized"
    },
    {
        "item_name": "Electrical Wire - 12/2 Romex",
        "category": "materials",
        "quantity": 8,
        "unit": "rolls",
        "project_id": project['id'],
        "location": "Electrical Supply Area",
        "unit_cost": 89.00,
        "supplier": "Electrical Wholesale",
        "notes": "250ft rolls, copper NM-B cable"
    }
]

for item in inventory_items:
    response = requests.post(f"{BACKEND_URL}/api/inventory", headers=headers, json=item)
    if response.ok:
        print(f"✅ Added: {item['item_name']}")
    else:
        print(f"⚠️ Failed: {item['item_name']} - {response.text}")

# Add items to second project if exists
if len(projects) > 1:
    project2 = projects[1]
    print(f"\n\nAdding inventory to project: {project2['name']}\n")
    
    items2 = [
        {"item_name": "Plywood - 3/4in", "category": "materials", "quantity": 45, "unit": "sheets", "project_id": project2['id'], "location": "Site Storage", "unit_cost": 42.00, "supplier": "Home Depot", "notes": "CDX grade plywood"},
        {"item_name": "PVC Pipe - 2in", "category": "materials", "quantity": 20, "unit": "pieces", "project_id": project2['id'], "location": "Plumbing Storage", "unit_cost": 15.75, "supplier": "Ferguson", "notes": "10ft sections Schedule 40"},
        {"item_name": "Insulation - R-19", "category": "materials", "quantity": 60, "unit": "rolls", "project_id": project2['id'], "location": "Warehouse - Climate", "unit_cost": 28.50, "supplier": "Builder's Supply", "notes": "Fiberglass batt insulation"}
    ]
    
    for item in items2:
        response = requests.post(f"{BACKEND_URL}/api/inventory", headers=headers, json=item)
        if response.ok:
            print(f"✅ Added: {item['item_name']}")

print("\n" + "="*60)
print("✅ Inventory test data created!")
print("="*60)
print(f"\nTotal value for {project['name']}: ${sum(item['unit_cost'] * item['quantity'] for item in inventory_items):.2f}")
print("\n💡 Go to Inventory page to see project-grouped view!")
