# Bulk API Routes for New Sections
# This file contains all CRUD operations for: Invoices, Expenses, Contracts, Equipment, 
# Timesheets, Safety Reports, Certifications, Inventory, Documents

from fastapi import HTTPException, Depends
from typing import List
from datetime import datetime, timezone
import uuid

# Helper function to prepare datetime fields
def prepare_datetime_fields(data_dict):
    for key, value in data_dict.items():
        if isinstance(value, datetime):
            data_dict[key] = value.isoformat()
    return data_dict

# Helper function to parse datetime fields
def parse_datetime_fields(item, fields):
    for field in fields:
        if item.get(field) and isinstance(item[field], str):
            item[field] = datetime.fromisoformat(item[field])
    return item

# Generic CRUD generator
def create_crud_endpoints(router, collection_name, model_class, create_class, update_class, 
                         datetime_fields=None, require_admin_for_delete=True):
    """
    Generates standard CRUD endpoints for a collection
    """
    if datetime_fields is None:
        datetime_fields = []
    
    @router.get(f"/{collection_name}", response_model=List[model_class])
    async def get_items(current_user: dict = Depends(get_current_user)):
        items = await db[collection_name].find({}, {"_id": 0}).to_list(1000)
        for item in items:
            item = parse_datetime_fields(item, datetime_fields + ['created_at'])
        return items
    
    @router.post(f"/{collection_name}", response_model=model_class)
    async def create_item(item: create_class, current_user: dict = Depends(get_current_user)):
        item_dict = item.model_dump()
        item_dict['id'] = str(uuid.uuid4())
        item_dict['created_by'] = current_user['username']
        item_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        item_dict = prepare_datetime_fields(item_dict)
        await db[collection_name].insert_one(item_dict)
        return item_dict
    
    @router.put(f"/{collection_name}/{{item_id}}", response_model=model_class)
    async def update_item(item_id: str, item: update_class, current_user: dict = Depends(get_current_user)):
        update_data = item.model_dump(exclude_unset=True)
        update_data = prepare_datetime_fields(update_data)
        
        result = await db[collection_name].update_one(
            {"id": item_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        
        updated_item = await db[collection_name].find_one({"id": item_id}, {"_id": 0})
        return updated_item
    
    @router.delete(f"/{collection_name}/{{item_id}}")
    async def delete_item(item_id: str, user: dict = Depends(get_admin_user if require_admin_for_delete else get_current_user)):
        result = await db[collection_name].delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": f"{collection_name.title()} deleted successfully"}

# This is a template - actual implementation will be in server.py
