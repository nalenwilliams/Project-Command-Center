import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import aiService from '@/lib/aiService';
import { toast } from 'sonner';

const AIAssistant = ({ context = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your Williams Diversified AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await aiService.chat(userMessage, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          style={{ backgroundColor: '#C9A961' }}
        >
          <Bot className="h-6 w-6 text-black" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card 
          className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col"
          style={{ backgroundColor: '#1a1a1a', borderColor: '#C9A961', borderWidth: '2px' }}
        >
          <CardHeader className="pb-3 border-b" style={{ borderColor: '#C9A961' }}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: '#C9A961' }}>
                <Bot className="h-5 w-5" />
                AI Assistant
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
                style={{ color: '#C9A961' }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'text-black'
                      : 'bg-gray-800 text-white'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: '#C9A961' } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#C9A961' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t" style={{ borderColor: '#C9A961' }}>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                disabled={loading}
                className="bg-gray-900 text-white border"
                style={{ borderColor: '#C9A961' }}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="icon"
                style={{ backgroundColor: '#C9A961' }}
                className="text-black"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIAssistant;
