// AI Service - Connects to Williams Diversified AI Core (Gemini 2.5 Pro)
// Running on port 3001 alongside FastAPI backend

const AI_BASE_URL = 'http://localhost:3001';

export const aiService = {
  // General AI chat assistant
  async chat(message, context = {}) {
    const response = await fetch(`${AI_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context }),
    });
    
    if (!response.ok) {
      throw new Error('AI chat failed');
    }
    
    return response.json();
  },

  // Generate construction proposal from project data
  async generateProposal(project, notes = '', options = {}) {
    const response = await fetch(`${AI_BASE_URL}/ai/proposal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project,
        notes,
        taxRate: options.taxRate || 0,
        overheads: options.overheads || [],
        margins: options.margins || [],
      }),
    });
    
    if (!response.ok) {
      throw new Error('Proposal generation failed');
    }
    
    return response.json();
  },

  // Extract structured data from notes
  async formFill(notes, schema, defaults = {}) {
    const response = await fetch(`${AI_BASE_URL}/ai/form-fill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes,
        schema,
        defaults,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Form fill failed');
    }
    
    return response.json();
  },

  // Compose email with AI assistance
  async composeEmail(context, purpose) {
    const response = await fetch(`${AI_BASE_URL}/compose/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        purpose,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Email composition failed');
    }
    
    return response.json();
  },

  // Send email via Gmail
  async sendEmail(to, subject, body, attachments = []) {
    const response = await fetch(`${AI_BASE_URL}/comms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        attachments,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Email send failed');
    }
    
    return response.json();
  },

  // Health check
  async checkHealth() {
    const response = await fetch(`${AI_BASE_URL}/health`);
    return response.json();
  },
};

export default aiService;
