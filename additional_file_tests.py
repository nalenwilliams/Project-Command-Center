#!/usr/bin/env python3
"""
Additional File Management Tests
Tests edge cases and additional file operations
"""

import requests
import json
import io
from datetime import datetime, timezone
import sys

BACKEND_URL = "https://project-command-5.preview.emergentagent.com/api"

def test_multiple_file_types():
    """Test uploading different file types"""
    session = requests.Session()
    
    # Login as admin
    login_data = {"username": "admin", "password": "Admin123!"}
    login_response = session.post(f"{BACKEND_URL}/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print("❌ Login failed")
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test different file types
    file_types = [
        ("test_image.jpg", b"fake_jpeg_content", "image/jpeg"),
        ("test_document.pdf", b"fake_pdf_content", "application/pdf"),
        ("test_spreadsheet.xlsx", b"fake_excel_content", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ("test_text.txt", b"This is a text file", "text/plain")
    ]
    
    uploaded_files = []
    
    for filename, content, content_type in file_types:
        files = {'file': (filename, io.BytesIO(content), content_type)}
        
        response = session.post(f"{BACKEND_URL}/upload", files=files, headers=headers)
        
        if response.status_code == 200:
            file_data = response.json()
            uploaded_files.append(file_data)
            print(f"✅ Successfully uploaded {filename}")
            
            # Test file serving
            serve_response = session.get(f"{BACKEND_URL}/uploads/{file_data['stored_filename']}")
            if serve_response.status_code == 200:
                print(f"✅ Successfully served {filename}")
            else:
                print(f"❌ Failed to serve {filename}")
        else:
            print(f"❌ Failed to upload {filename}: {response.text}")
    
    return len(uploaded_files) == len(file_types)

def test_file_deletion_integrity():
    """Test that deleting records doesn't break file serving"""
    session = requests.Session()
    
    # Login as admin
    login_data = {"username": "admin", "password": "Admin123!"}
    login_response = session.post(f"{BACKEND_URL}/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print("❌ Login failed")
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Upload a test file
    test_content = b"Test file for deletion integrity test"
    files = {'file': ("deletion_test.txt", io.BytesIO(test_content), "text/plain")}
    
    upload_response = session.post(f"{BACKEND_URL}/upload", files=files, headers={"Authorization": f"Bearer {token}"})
    
    if upload_response.status_code != 200:
        print("❌ File upload failed")
        return False
    
    uploaded_file = upload_response.json()
    
    # Create a project with the file
    project_data = {
        "name": "Test Project for Deletion",
        "description": "Project to test file deletion integrity",
        "files": [uploaded_file]
    }
    
    project_response = session.post(f"{BACKEND_URL}/projects", json=project_data, headers=headers)
    
    if project_response.status_code != 200:
        print("❌ Project creation failed")
        return False
    
    project = project_response.json()
    
    # Verify file is accessible
    file_response = session.get(f"{BACKEND_URL}/uploads/{uploaded_file['stored_filename']}")
    if file_response.status_code != 200:
        print("❌ File not accessible before deletion")
        return False
    
    # Delete the project
    delete_response = session.delete(f"{BACKEND_URL}/projects/{project['id']}", headers=headers)
    
    if delete_response.status_code != 200:
        print("❌ Project deletion failed")
        return False
    
    # Verify file is still accessible (files should persist even if records are deleted)
    file_response_after = session.get(f"{BACKEND_URL}/uploads/{uploaded_file['stored_filename']}")
    if file_response_after.status_code == 200:
        print("✅ File remains accessible after record deletion")
        return True
    else:
        print("❌ File became inaccessible after record deletion")
        return False

def main():
    print("🚀 Running Additional File Management Tests")
    print("=" * 60)
    
    # Test 1: Multiple file types
    print("\n📁 Testing Multiple File Types...")
    file_types_success = test_multiple_file_types()
    
    # Test 2: File deletion integrity
    print("\n🗑️ Testing File Deletion Integrity...")
    deletion_integrity_success = test_file_deletion_integrity()
    
    print("\n" + "=" * 60)
    print("📊 ADDITIONAL TESTS SUMMARY")
    print("=" * 60)
    
    total_tests = 2
    passed_tests = sum([file_types_success, deletion_integrity_success])
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    
    if passed_tests == total_tests:
        print("✅ All additional tests passed!")
        return True
    else:
        print("❌ Some additional tests failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)