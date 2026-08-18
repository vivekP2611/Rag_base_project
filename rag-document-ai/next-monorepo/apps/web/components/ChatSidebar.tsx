'use client';

import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  documentId?: string;
  enabled?: boolean;
  onSendMessage?: (message: string) => Promise<string>;
  isLoading?: boolean;
  triggerQuestion?: string;
  onClearTriggerQuestion?: () => void;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-indigo-300">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-sm leading-relaxed">
      {lines.map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {renderMarkdown(line)}
        </p>
      ))}
    </div>
  );
}

export function ChatSidebar({
  documentId,
  enabled = false,
  onSendMessage,
  isLoading = false,
  triggerQuestion,
  onClearTriggerQuestion,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    setMessages([]);
  }, [documentId]);

  useEffect(() => {
    if (triggerQuestion && enabled && !loading) {
      const sendTriggered = async () => {
        const userMsg: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: triggerQuestion.trim(),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        if (onClearTriggerQuestion) onClearTriggerQuestion();

        try {
          if (onSendMessage) {
            const response = await onSendMessage(userMsg.content);
            const assistantMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: response,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        } catch {
          const errMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Connection lost in the neural matrix. Please try again.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errMsg]);
        } finally {
          setLoading(false);
        }
      };
      sendTriggered();
    }
  }, [triggerQuestion, enabled, loading, onSendMessage, onClearTriggerQuestion]);

  const handleSend = async () => {
    if (!input.trim() || !enabled || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (onSendMessage) {
        const response = await onSendMessage(userMsg.content);
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Connection lost in the neural matrix. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 bg-transparent flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white tracking-tight text-lg">DocMind AI</h3>
          <p className="text-xs text-indigo-300 font-medium">Ready for your questions</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                {enabled
                  ? 'The document knowledge base is loaded. Ask me anything.'
                  : 'Awaiting document upload...'}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex-shrink-0 flex items-center justify-center mt-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
            )}

            <div
              className={`max-w-[85%] px-5 py-3.5 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm shadow-[0_0_20px_rgba(79,70,229,0.3)]'
                  : 'bg-white/[0.03] text-gray-200 rounded-bl-sm border border-white/10 shadow-inner'
              }`}
            >
              <MessageContent text={msg.content} />
              <p
                className={`text-[10px] mt-2 font-medium tracking-wide ${
                  msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-gray-500'
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex-shrink-0 flex items-center justify-center mt-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-white/[0.03] border border-white/10 px-5 py-4 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-inner">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input */}
      <div className="p-4 bg-transparent border-t border-white/5">
        <div className="flex gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 focus-within:border-indigo-500/50 focus-within:bg-white/[0.05] transition-colors shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={enabled ? 'Message DocMind...' : 'Upload a document first'}
            disabled={!enabled || loading}
            className="flex-1 px-4 py-2.5 bg-transparent border-none text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!enabled || loading || !input.trim()}
            className="w-11 h-11 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:shadow-none"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
