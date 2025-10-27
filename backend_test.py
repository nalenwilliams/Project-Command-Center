#!/usr/bin/env python3
"""
Backend API Testing Script for Project Command Center
Tests file management functionality across all record types
"""

import requests
import json
import os
import io
from datetime import datetime, timezone
import sys
import tempfile

# Get backend URL from frontend .env file
BACKEND_URL = "https://taskflow-hub-131.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_admin_login(self):
        """Test admin login with credentials: admin/admin123"""
        try:
            login_data = {
                "username": "admin",
                "password": "Admin123!"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    user_info = data["user"]
                    
                    # Verify admin role
                    if user_info.get("role") == "admin":
                        self.log_result(
                            "Admin Login", 
                            True, 
                            f"Successfully logged in as admin user: {user_info.get('username')}"
                        )
                        return True
                    else:
                        self.log_result(
                            "Admin Login", 
                            False, 
                            f"User logged in but role is '{user_info.get('role')}', expected 'admin'"
                        )
                        return False
                else:
                    self.log_result(
                        "Admin Login", 
                        False, 
                        "Login response missing required fields",
                        f"Response: {data}"
                    )
                    return False
            else:
                self.log_result(
                    "Admin Login", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    f"Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Admin Login", 
                False, 
                f"Login request failed: {str(e)}"
            )
            return False
    
    def test_get_users_list(self):
        """Test getting list of users"""
        if not self.auth_token:
            self.log_result("Get Users List", False, "No auth token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/users",
                headers=headers
            )
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    self.log_result(
                        "Get Users List", 
                        True, 
                        f"Successfully retrieved {len(users)} users"
                    )
                    return users
                else:
                    self.log_result(
                        "Get Users List", 
                        False, 
                        "Response is not a list",
                        f"Response: {users}"
                    )
                    return False
            else:
                self.log_result(
                    "Get Users List", 
                    False, 
                    f"Failed to get users with status {response.status_code}",
                    f"Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Get Users List", 
                False, 
                f"Get users request failed: {str(e)}"
            )
            return False
    
    def test_create_and_assign_task(self, users_list):
        """Test creating a task and assigning it to an employee"""
        if not self.auth_token:
            self.log_result("Create and Assign Task", False, "No auth token available")
            return False
            
        if not users_list:
            self.log_result("Create and Assign Task", False, "No users list available")
            return False
            
        # Find an employee to assign the task to
        employee_user = None
        for user in users_list:
            if user.get("role") == "employee" and user.get("is_active", True):
                employee_user = user
                break
        
        if not employee_user:
            self.log_result(
                "Create and Assign Task", 
                False, 
                "No active employee found to assign task to"
            )
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Create task data
            task_data = {
                "title": "Test Task - Backend Testing",
                "description": "This is a test task created during backend testing to verify task assignment notifications",
                "assigned_to": employee_user["id"],
                "status": "todo",
                "priority": "medium",
                "due_date": datetime.now(timezone.utc).isoformat()
            }
            
            response = self.session.post(
                f"{self.base_url}/tasks",
                json=task_data,
                headers=headers
            )
            
            if response.status_code == 200:
                created_task = response.json()
                if "id" in created_task and created_task.get("assigned_to") == employee_user["id"]:
                    self.log_result(
                        "Create and Assign Task", 
                        True, 
                        f"Successfully created task '{created_task.get('title')}' and assigned to {employee_user.get('username')}"
                    )
                    return created_task
                else:
                    self.log_result(
                        "Create and Assign Task", 
                        False, 
                        "Task created but assignment verification failed",
                        f"Created task: {created_task}"
                    )
                    return False
            else:
                self.log_result(
                    "Create and Assign Task", 
                    False, 
                    f"Failed to create task with status {response.status_code}",
                    f"Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Create and Assign Task", 
                False, 
                f"Create task request failed: {str(e)}"
            )
            return False
    
    def test_verify_task_creation(self, created_task):
        """Verify the task was created successfully by retrieving it"""
        if not self.auth_token or not created_task:
            self.log_result("Verify Task Creation", False, "No auth token or created task available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Get the specific task
            response = self.session.get(
                f"{self.base_url}/tasks/{created_task['id']}",
                headers=headers
            )
            
            if response.status_code == 200:
                retrieved_task = response.json()
                if (retrieved_task.get("id") == created_task["id"] and 
                    retrieved_task.get("title") == created_task["title"] and
                    retrieved_task.get("assigned_to") == created_task["assigned_to"]):
                    self.log_result(
                        "Verify Task Creation", 
                        True, 
                        f"Task verification successful - task exists and data matches"
                    )
                    return True
                else:
                    self.log_result(
                        "Verify Task Creation", 
                        False, 
                        "Task data mismatch during verification",
                        f"Expected: {created_task}, Retrieved: {retrieved_task}"
                    )
                    return False
            else:
                self.log_result(
                    "Verify Task Creation", 
                    False, 
                    f"Failed to retrieve task with status {response.status_code}",
                    f"Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Verify Task Creation", 
                False, 
                f"Verify task request failed: {str(e)}"
            )
            return False
    
    def test_notification_system_status(self):
        """Test if notification system is configured (admin only)"""
        if not self.auth_token:
            self.log_result("Notification System Status", False, "No auth token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{self.base_url}/admin/notification-settings",
                headers=headers
            )
            
            if response.status_code == 200:
                settings = response.json()
                enabled = settings.get("enabled", False)
                notify_assignments = settings.get("notify_assignments", False)
                
                if enabled and notify_assignments:
                    self.log_result(
                        "Notification System Status", 
                        True, 
                        "Notification system is enabled and configured for task assignments"
                    )
                else:
                    self.log_result(
                        "Notification System Status", 
                        False, 
                        f"Notification system not fully configured - enabled: {enabled}, notify_assignments: {notify_assignments}",
                        f"Settings: {settings}"
                    )
                return settings
            else:
                self.log_result(
                    "Notification System Status", 
                    False, 
                    f"Failed to get notification settings with status {response.status_code}",
                    f"Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Notification System Status", 
                False, 
                f"Notification settings request failed: {str(e)}"
            )
            return False
    
    def test_ai_chat_functionality(self):
        """Test AI chat endpoint functionality"""
        if not self.auth_token:
            self.log_result("AI Chat Functionality", False, "No auth token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test AI chat with a simple message
            chat_data = {
                "message": "Hello, can you help me?",
                "conversation_history": [],
                "current_page": "Dashboard"
            }
            
            response = self.session.post(
                f"{self.base_url}/ai/chat",
                json=chat_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data and data["response"]:
                    ai_response = data["response"]
                    
                    # Check if response is meaningful (not an error message)
                    error_indicators = [
                        "error", "failed", "trouble", "unable", "cannot", 
                        "exception", "invalid", "unauthorized"
                    ]
                    
                    response_lower = ai_response.lower()
                    has_error = any(indicator in response_lower for indicator in error_indicators)
                    
                    # Check if response is substantial (more than just a few words)
                    is_substantial = len(ai_response.strip()) > 10
                    
                    if not has_error and is_substantial:
                        self.log_result(
                            "AI Chat Functionality", 
                            True, 
                            f"AI chat working correctly - received meaningful response: '{ai_response[:100]}...'" if len(ai_response) > 100 else f"AI chat working correctly - received response: '{ai_response}'"
                        )
                        return True
                    else:
                        self.log_result(
                            "AI Chat Functionality", 
                            False, 
                            f"AI chat returned error or insufficient response: '{ai_response}'"
                        )
                        return False
                else:
                    self.log_result(
                        "AI Chat Functionality", 
                        False, 
                        "AI chat response missing 'response' field",
                        f"Response: {data}"
                    )
                    return False
            else:
                self.log_result(
                    "AI Chat Functionality", 
                    False, 
                    f"AI chat failed with status {response.status_code}",
                    f"Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "AI Chat Functionality", 
                False, 
                f"AI chat request failed: {str(e)}"
            )
            return False
    
    def run_all_tests(self):
        """Run all file management tests"""
        print(f"🚀 Starting File Management Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Admin Login
        login_success = self.test_admin_login()
        
        if not login_success:
            print("\n❌ Cannot proceed with other tests - admin login failed")
            return self.generate_summary()
        
        # Test 2: File Upload Endpoint
        uploaded_file = self.test_file_upload_endpoint()
        
        if not uploaded_file:
            print("\n❌ Cannot proceed with file operations tests - file upload failed")
            return self.generate_summary()
        
        # Test 3: File Serving Endpoint
        self.test_file_serving_endpoint(uploaded_file)
        
        # Test 4-11: File Operations for All Record Types
        self.test_project_file_operations(uploaded_file)
        self.test_task_file_operations(uploaded_file)
        self.test_client_file_operations(uploaded_file)
        self.test_invoice_file_operations(uploaded_file)
        self.test_expense_file_operations(uploaded_file)
        self.test_contract_file_operations(uploaded_file)
        self.test_equipment_file_operations(uploaded_file)
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "No tests run")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = BackendTester()
    summary = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    if summary["failed"] > 0:
        sys.exit(1)
    else:
        print("\n✅ All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()