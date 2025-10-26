# AI Integration - Williams Diversified LLC Project Command Center

## Overview
Comprehensive AI integration powered by OpenAI GPT-4o-mini using the Emergent LLM Key system.

## AI Features by Module

### 1. **Global AI Assistant (All Pages)**
- **Floating Chat Widget**: Available on every page via sparkle icon (bottom-right)
- Context-aware responses based on current page and user role
- Persistent conversation within session
- Can answer questions about:
  - How to use the system
  - Project management advice
  - Task prioritization
  - Business operations guidance

### 2. **Projects Module**
**AI Features:**
- **Auto-Generate Project Description**: Create detailed project descriptions from title
- **Task Suggestions**: AI recommends tasks needed for project completion
- **Risk Analysis**: Identify potential project risks
- **Timeline Predictions**: Get AI-suggested timelines based on project scope

**How to Use:**
- Click "AI Suggest" when creating/editing projects
- AI will analyze project details and provide recommendations

### 3. **Tasks Module**
**AI Features:**
- **Smart Task Breakdown**: Convert high-level tasks into subtasks
- **Priority Recommendations**: AI suggests task priorities
- **Time Estimates**: Get estimated completion times

**How to Use:**
- Use AI Assistant to ask: "Help me break down this task"
- AI analyzes task complexity and provides structured breakdown

### 4. **Financial Management (Invoices/Expenses)**
**AI Features:**
- **Auto-Categorize Expenses**: AI automatically categorizes expenses
  - Categories: Materials, Labor, Equipment, Transportation, Utilities, Office Supplies, Professional Services, Insurance, Maintenance, Other
- **Invoice Description Generator**: Create professional invoice descriptions
- **Financial Insights**: Get AI analysis of spending patterns

**How to Use:**
- When adding expenses, AI auto-suggests category
- For invoices, AI generates professional descriptions from work items

### 5. **Contracts Module**
**AI Features:**
- **Contract Summarization**: Get concise summaries of lengthy contracts
- **Key Clause Identification**: AI highlights important clauses
- **Risk Assessment**: Identify potential contract risks
- **Action Items Extraction**: Pull out deadlines and obligations

**How to Use:**
- Upload contract document
- Click "AI Analyze" → Select analysis type (Summarize, Risks, Actions)

### 6. **Safety Reports Module**
**AI Features:**
- **Incident Analysis**: Comprehensive safety incident analysis
  - Severity Assessment (Low/Medium/High/Critical)
  - Root Cause Analysis
  - Preventive Recommendations
- **Trend Analysis**: Identify patterns in safety incidents
- **Compliance Recommendations**: AI suggests compliance improvements

**How to Use:**
- Enter incident description
- AI provides structured analysis with actionable recommendations

### 7. **Reports & Documents**
**AI Features:**
- **Auto-Generate Reports**: Create reports from project data
- **Document Summarization**: Summarize any document instantly
- **Key Insights Extraction**: Pull out most important information
- **Data Analysis**: AI analyzes trends and patterns

**How to Use:**
- Select data to analyze
- Choose report type
- AI generates formatted report

### 8. **Operations (Timesheets, Inventory, Schedules)**
**AI Features:**
- **Schedule Optimization**: AI suggests optimal schedules
- **Inventory Predictions**: Forecast inventory needs
- **Timesheet Analysis**: Identify time allocation patterns

**How to Use:**
- Chat with AI Assistant about operational questions
- Ask for recommendations on resource allocation

## API Endpoints

### Backend AI Endpoints:
```
POST /api/ai/generate              - General text generation
POST /api/ai/analyze               - Document analysis
POST /api/ai/suggest-tasks         - Task suggestions for projects
POST /api/ai/categorize-expense    - Auto-categorize expenses
POST /api/ai/generate-invoice-description - Generate invoice descriptions
POST /api/ai/safety-analysis       - Analyze safety incidents
POST /api/ai/chat                  - Chat with AI assistant
```

## Technical Details

### Backend:
- **File**: `/app/backend/ai_service.py`
- **Integration**: Emergent LLM via `emergentintegrations` library
- **Model**: OpenAI GPT-4o-mini
- **Authentication**: EMERGENT_LLM_KEY (in backend/.env)

### Frontend:
- **Component**: `/app/frontend/src/components/AIFloatingChat.jsx`
- **Placement**: Integrated in Layout.jsx (available on all pages)
- **Styling**: Black & gold theme matching Williams Diversified branding

## Usage Examples

### Example 1: Project Task Generation
**User**: "I need to create a commercial building renovation project"
**AI**: Generates 5-8 specific tasks like:
1. Conduct site inspection and assessment
2. Obtain necessary permits and approvals
3. Create detailed renovation plans
4. Source materials and equipment
5. Schedule contractor teams
6. Implement safety protocols
7. Quality control inspections
8. Final walkthrough and documentation

### Example 2: Expense Categorization
**Input**: "Purchased 500 feet of electrical wire and conduit"
**AI Output**: "Materials"

### Example 3: Safety Incident Analysis
**Input**: "Employee slipped on wet floor in warehouse section B"
**AI Output**:
```json
{
  "severity": "Medium",
  "root_cause": "Inadequate warning signage and possible maintenance delay in addressing spill",
  "recommendations": [
    "Install more prominent wet floor warning signs",
    "Implement immediate spill response protocol",
    "Conduct slip-resistant flooring assessment",
    "Provide non-slip footwear to warehouse staff"
  ]
}
```

### Example 4: Contract Analysis
**User**: Uploads 20-page construction contract
**AI**: Provides:
- 2-paragraph summary
- Key deadlines (dates extracted)
- Payment terms
- Potential risk areas
- Required insurance coverage

## Best Practices

1. **Be Specific**: The more context you provide, the better AI responses
2. **Review AI Suggestions**: Always review AI-generated content before using
3. **Iterate**: If first response isn't perfect, ask follow-up questions
4. **Context Matters**: AI considers your role (Admin/Manager/Employee) in responses

## Limitations

- AI responses are suggestions, not legal/financial advice
- Always verify critical information
- AI doesn't have access to your personal documents (privacy-safe)
- Requires internet connection for API calls

## Support

If AI features aren't working:
1. Check backend logs: `tail -f /var/log/supervisor/backend.*.log`
2. Verify EMERGENT_LLM_KEY is set in backend/.env
3. Ensure frontend can reach backend API
4. Check browser console for errors

## Cost Management

- Using Emergent LLM Key (prepaid credits)
- Monitor usage in Profile → Universal Key
- Can add more balance or switch to own OpenAI key anytime
