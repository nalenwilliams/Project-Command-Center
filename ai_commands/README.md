# WDL AI Command Router
Natural language navigation for Williams Diversified Command Center.

### API Endpoint
POST /nav/resolve
Body: { "command": "open payroll" }
Response: { "intent": "NAVIGATE", "route": "/payroll" }

### Frontend
Use CommandBar.jsx to type or speak commands and navigate automatically.

### Run
npm install
npm run dev
