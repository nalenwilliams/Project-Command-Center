#!/usr/bin/env python3
import re
import os

pages = [
    'CompliancePage.jsx',
    'ClientsPage.jsx', 
    'EmployeesPage.jsx',
    'FleetInspectionPage.jsx'
]

for page_name in pages:
    file_path = f'/app/frontend/src/pages/{page_name}'
    if not os.path.exists(file_path):
        print(f'⚠️  Skipping {page_name} - file not found')
        continue
        
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Add FileGalleryFullScreen import if not present
    if 'FileGalleryFullScreen' not in content:
        content = content.replace(
            "import FileGallery from '@/components/FileGallery';",
            "import FileGallery from '@/components/FileGallery';\nimport FileGalleryFullScreen from '@/components/FileGalleryFullScreen';"
        )
    
    # 2. Add gallery state variables after existing state
    state_pattern = r'(const \[dialogOpen, setDialogOpen\] = useState\(false\);)'
    if 'galleryOpen' not in content:
        content = re.sub(
            state_pattern,
            r'\1\n  const [galleryOpen, setGalleryOpen] = useState(false);\n  const [selectedItem, setSelectedItem] = useState(null);',
            content
        )
    
    # 3. Make table rows clickable and remove FileGallery
    # Find TableRow patterns and update them
    tablerow_pattern = r'<TableRow key={([^}]+)} className="border-b hover:bg-gray-800" style={{ borderColor: \'#374151\' }}>'
    if 'cursor-pointer' not in content:
        content = re.sub(
            tablerow_pattern,
            r'<TableRow key={\1} className="border-b hover:bg-gray-800 cursor-pointer" style={{ borderColor: \'#374151\' }} onClick={() => { setSelectedItem(\1); setGalleryOpen(true); }}>',
            content
        )
    
    # Remove FileGallery component from actions
    content = re.sub(
        r'<FileGallery item={[^}]+} itemType="[^"]+" onUpdate={[^}]+} canDelete={[^}]+} />\s*',
        '',
        content
    )
    
    # 4. Add stopPropagation to actions cell
    content = re.sub(
        r'<TableCell className="text-right">',
        r'<TableCell className="text-right" onClick={(e) => e.stopPropagation()}>',
        content
    )
    
    # 5. Make dialog scrollable
    content = re.sub(
        r'<DialogContent className="bg-gray-900 border max-w-2xl"',
        r'<DialogContent className="bg-gray-900 border max-w-2xl max-h-[90vh] overflow-y-auto"',
        content
    )
    
    # 6. Add FileGalleryFullScreen before closing div
    export_pattern = r'(      </Dialog>\s*</div>\s*\);\s*};\s*export default)'
    if 'FileGalleryFullScreen' not in content or 'isOpen={galleryOpen}' not in content:
        # Determine record type from page name
        record_type = page_name.replace('Page.jsx', '').lower()
        if record_type == 'fleetinspection':
            record_type = 'fleet-inspection'
        elif record_type == 'clients':
            record_type = 'client'
        elif record_type == 'employees':
            record_type = 'employee'
        elif record_type == 'compliance':
            record_type = 'compliance'
            
        gallery_component = f'''      </Dialog>\n\n      {{/* FileGalleryFullScreen for viewing details */}}\n      <FileGalleryFullScreen\n        isOpen={{galleryOpen}}\n        onClose={{() => setGalleryOpen(false)}}\n        record={{selectedItem}}\n        recordType="{record_type}"\n        files={{selectedItem?.files || []}}\n        onUpdate={{fetchData}}\n        canDelete={{canDelete}}\n      />\n    </div>\n  );\n}};\n\nexport default'''
        
        content = re.sub(export_pattern, gallery_component, content)
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f'✅ Updated {page_name}')
    else:
        print(f'⚠️  No changes needed for {page_name}')

print('\n✅ Batch update complete!')
