import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            logger.warning("EMERGENT_LLM_KEY not found in environment")
            
    def create_chat(self, session_id: str, system_message: str) -> LlmChat:
        """Create a new chat instance"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system_message
        )
        chat.with_model("openai", "gpt-4o-mini")
        return chat
    
    async def generate_text(self, prompt: str, context: str = "") -> str:
        """Generate text using AI"""
        try:
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            chat = self.create_chat("generation", "You are a helpful AI assistant for the Williams Diversified LLC Project Command Center.")
            message = UserMessage(text=full_prompt)
            response = await chat.send_message(message)
            return response
        except Exception as e:
            logger.error(f"AI generation error: {str(e)}")
            return f"AI generation failed: {str(e)}"
    
    async def analyze_document(self, document_content: str, analysis_type: str) -> str:
        """Analyze documents and provide insights"""
        try:
            system_msg = "You are an expert document analyst. Provide clear, concise analysis."
            chat = self.create_chat("document-analysis", system_msg)
            
            prompts = {
                "summarize": f"Summarize the following document concisely:\n\n{document_content}",
                "risks": f"Identify potential risks in this document:\n\n{document_content}",
                "actions": f"Extract action items from this document:\n\n{document_content}",
                "insights": f"Provide key insights from this document:\n\n{document_content}"
            }
            
            prompt = prompts.get(analysis_type, prompts["insights"])
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            return response
        except Exception as e:
            logger.error(f"Document analysis error: {str(e)}")
            return f"Analysis failed: {str(e)}"
    
    async def suggest_tasks(self, project_title: str, project_description: str) -> str:
        """Generate task suggestions for a project"""
        try:
            system_msg = "You are a project management expert. Generate specific, actionable tasks."
            chat = self.create_chat("task-suggestions", system_msg)
            
            prompt = f"""Given this project:
Title: {project_title}
Description: {project_description}

Generate 5-8 specific, actionable tasks needed to complete this project. Format as a numbered list."""
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            return response
        except Exception as e:
            logger.error(f"Task suggestion error: {str(e)}")
            return f"Task suggestion failed: {str(e)}"
    
    async def categorize_expense(self, expense_description: str) -> str:
        """Auto-categorize an expense"""
        try:
            chat = self.create_chat("expense-categorization", "You are a financial categorization expert.")
            
            prompt = f"""Categorize this expense into ONE of these categories: Materials, Labor, Equipment, Transportation, Utilities, Office Supplies, Professional Services, Insurance, Maintenance, Other.

Expense: {expense_description}

Respond with ONLY the category name, nothing else."""
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            return response.strip()
        except Exception as e:
            logger.error(f"Expense categorization error: {str(e)}")
            return "Other"
    
    async def generate_invoice_description(self, project_name: str, work_items: list) -> str:
        """Generate professional invoice descriptions"""
        try:
            chat = self.create_chat("invoice-generation", "You are a professional invoice writer.")
            
            items_str = "\n".join(f"- {item}" for item in work_items)
            prompt = f"""Generate a professional invoice description for:
Project: {project_name}
Work completed:
{items_str}

Write a clear, professional description suitable for an invoice (2-3 sentences)."""
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            return response
        except Exception as e:
            logger.error(f"Invoice description generation error: {str(e)}")
            return f"Work completed for {project_name}"
    
    async def safety_analysis(self, incident_description: str) -> dict:
        """Analyze safety incidents and provide recommendations"""
        try:
            chat = self.create_chat("safety-analysis", "You are a workplace safety expert.")
            
            prompt = f"""Analyze this safety incident:
{incident_description}

Provide:
1. Severity Assessment (Low/Medium/High/Critical)
2. Root Cause Analysis (2-3 sentences)
3. Preventive Recommendations (3-5 bullet points)

Format as JSON with keys: severity, root_cause, recommendations"""
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            
            # Parse response
            import json
            try:
                result = json.loads(response)
            except:
                result = {
                    "severity": "Medium",
                    "root_cause": response[:200],
                    "recommendations": ["Review safety procedures", "Provide additional training"]
                }
            
            return result
        except Exception as e:
            logger.error(f"Safety analysis error: {str(e)}")
            return {
                "severity": "Unknown",
                "root_cause": str(e),
                "recommendations": ["Unable to analyze"]
            }
    
    async def chat_assistant(self, user_message: str, conversation_history: list, user_context: dict) -> str:
        """General chat assistant with context awareness"""
        try:
            context_info = f"""You are an AI assistant for Williams Diversified LLC Project Command Center.
User: {user_context.get('username', 'User')} (Role: {user_context.get('role', 'employee')})
Current Page: {user_context.get('current_page', 'Dashboard')}

Help the user with project management, tasks, and business operations."""

            chat = self.create_chat(f"chat-{user_context.get('user_id', 'unknown')}", context_info)
            
            message = UserMessage(text=user_message)
            response = await chat.send_message(message)
            return response
        except Exception as e:
            logger.error(f"Chat assistant error: {str(e)}")
            return "I'm having trouble responding right now. Please try again."

# Global AI service instance
_ai_service = None

def get_ai_service() -> AIService:
    """Get or create AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
