import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles } from 'lucide-react';
import { aiService } from '@/services/aiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  relatedSegments?: string[];
  timestamp: number;
}

interface StrategyCopilotProps {
  onClose?: () => void;
  embedded?: boolean;
}

export default function StrategyCopilot({ onClose, embedded = false }: StrategyCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I'm your Strategy Copilot, powered by Kearney's multi-agent analytics platform. I can help you understand customer segments, churn drivers, retention strategies, and ROI projections. What would you like to know?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));

      const response = await aiService.ask(input);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        relatedSegments: response.relatedSegments,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try rephrasing or ask about segments, churn drivers, or retention strategies.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "Why is the Medium Risk segment so large?",
    "What should we do about month-to-month customers?",
    "What's the optimal retention budget?",
    "Tell me about early-tenure customers",
  ];

  return (
    <div
      className={`flex flex-col ${
        embedded ? 'h-full' : 'fixed bottom-6 right-6 w-96 h-[600px]'
      } bg-bg-secondary border-2 rounded-lg shadow-2xl`}
      style={{ borderColor: 'var(--color-accent-primary)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-accent-primary)' }}>
        <div className="flex items-center space-x-2">
          <Sparkles size={20} className="text-white" />
          <h3 className="text-white font-semibold">Strategy Copilot</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white hover:opacity-80">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[85%]`}>
              {/* Avatar */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: message.role === 'user' ? 'var(--color-bg-tertiary)' : 'var(--color-accent-primary)',
                }}
              >
                {message.role === 'user' ? (
                  <User size={16} className="text-text-primary" />
                ) : (
                  <Bot size={16} className="text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={message.role === 'user' ? 'mr-2' : 'ml-2'}>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-bg-tertiary text-text-primary'
                      : 'bg-bg-primary text-text-secondary'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.citations.map((citation, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}
                      >
                        📎 {citation}
                      </span>
                    ))}
                  </div>
                )}

                {/* Related Segments */}
                {message.relatedSegments && message.relatedSegments.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-text-tertiary mb-1">Related segments:</div>
                    <div className="flex flex-wrap gap-1">
                      {message.relatedSegments.map((segment, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded font-mono"
                          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                        >
                          {segment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-accent-primary)' }}
              >
                <Bot size={16} className="text-white" />
              </div>
              <div className="ml-2 p-3 rounded-lg bg-bg-primary">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-text-tertiary mb-2">Try asking:</div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, i) => (
              <button
                key={i}
                onClick={() => setInput(question)}
                className="text-xs px-3 py-1.5 rounded border hover:bg-bg-tertiary transition-colors"
                style={{ borderColor: 'var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border-primary)' }}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about segments, churn, or strategies..."
            disabled={isThinking}
            className="flex-1 px-3 py-2 rounded text-sm bg-bg-primary text-text-primary border focus:outline-none"
            style={{ borderColor: 'var(--color-border-primary)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="px-4 py-2 rounded font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-accent-primary)', color: '#FFFFFF' }}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 text-xs text-text-tertiary">
          Powered by Data, ML, Strategy & QA Agents
        </div>
      </div>
    </div>
  );
}
