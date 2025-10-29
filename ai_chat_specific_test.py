#!/usr/bin/env python3
"""
Specific AI Chat Functionality Test
Tests the AI chat endpoint with various scenarios
"""

import requests
import json
import os
from datetime import datetime, timezone

# Get backend URL from frontend .env file
BACKEND_URL = "https://williams-portal.preview.emergentagent.com/api"

class AIChatTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.auth_token = None
        
    def login_admin(self):
        """Login as admin to get auth token"""
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
                self.auth_token = data["access_token"]
                print("✅ Admin login successful")
                return True
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def test_ai_chat_scenarios(self):
        """Test AI chat with different scenarios"""
        if not self.auth_token:
            print("❌ No auth token available")
            return
            
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        test_scenarios = [
            {
                "name": "Simple Greeting",
                "message": "Hello, can you help me?",
                "expected_keywords": ["help", "assist", "how", "can"]
            },
            {
                "name": "Project Management Question",
                "message": "How do I create a new project in the system?",
                "expected_keywords": ["project", "create", "new"]
            },
            {
                "name": "Task Management Question", 
                "message": "What's the best way to assign tasks to team members?",
                "expected_keywords": ["task", "assign", "team"]
            },
            {
                "name": "Business Operations Question",
                "message": "Can you help me understand the invoice process?",
                "expected_keywords": ["invoice", "process", "help"]
            }
        ]
        
        print("\n🧪 Testing AI Chat Scenarios:")
        print("=" * 50)
        
        for scenario in test_scenarios:
            print(f"\n📝 Testing: {scenario['name']}")
            print(f"Message: '{scenario['message']}'")
            
            try:
                chat_data = {
                    "message": scenario["message"],
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
                        print(f"✅ Response received: '{ai_response[:150]}{'...' if len(ai_response) > 150 else ''}'")
                        
                        # Check for expected keywords (case insensitive)
                        response_lower = ai_response.lower()
                        found_keywords = [kw for kw in scenario["expected_keywords"] if kw.lower() in response_lower]
                        
                        if found_keywords:
                            print(f"✅ Response is contextually relevant (found keywords: {found_keywords})")
                        else:
                            print(f"⚠️  Response may not be contextually relevant (expected keywords: {scenario['expected_keywords']})")
                        
                        # Check response quality
                        if len(ai_response.strip()) > 20:
                            print("✅ Response is substantial")
                        else:
                            print("⚠️  Response is very short")
                            
                    else:
                        print(f"❌ Invalid response format: {data}")
                else:
                    print(f"❌ Request failed with status {response.status_code}: {response.text}")
                    
            except Exception as e:
                print(f"❌ Test error: {str(e)}")
    
    def test_conversation_history(self):
        """Test AI chat with conversation history"""
        if not self.auth_token:
            print("❌ No auth token available")
            return
            
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        print("\n🔄 Testing Conversation History:")
        print("=" * 40)
        
        # First message
        print("\n📝 First message: 'My name is John'")
        chat_data = {
            "message": "My name is John",
            "conversation_history": [],
            "current_page": "Dashboard"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/ai/chat",
                json=chat_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                first_response = data.get("response", "")
                print(f"✅ First response: '{first_response[:100]}{'...' if len(first_response) > 100 else ''}'")
                
                # Second message with history
                print("\n📝 Second message: 'What is my name?'")
                chat_data = {
                    "message": "What is my name?",
                    "conversation_history": [
                        {"role": "user", "content": "My name is John"},
                        {"role": "assistant", "content": first_response}
                    ],
                    "current_page": "Dashboard"
                }
                
                response = self.session.post(
                    f"{self.base_url}/ai/chat",
                    json=chat_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    second_response = data.get("response", "")
                    print(f"✅ Second response: '{second_response[:100]}{'...' if len(second_response) > 100 else ''}'")
                    
                    # Check if AI remembers the name
                    if "john" in second_response.lower():
                        print("✅ AI correctly remembered the name from conversation history")
                    else:
                        print("⚠️  AI may not have used conversation history effectively")
                else:
                    print(f"❌ Second request failed: {response.status_code}")
            else:
                print(f"❌ First request failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Conversation test error: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run comprehensive AI chat tests"""
        print("🤖 AI Chat Comprehensive Testing")
        print("=" * 60)
        
        if not self.login_admin():
            return
            
        self.test_ai_chat_scenarios()
        self.test_conversation_history()
        
        print("\n" + "=" * 60)
        print("🎯 AI Chat Testing Complete")

if __name__ == "__main__":
    tester = AIChatTester()
    tester.run_comprehensive_test()