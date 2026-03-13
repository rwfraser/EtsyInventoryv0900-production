'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Trash2, X } from 'lucide-react';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';
import { TypingIndicator } from './chat/TypingIndicator';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    result: any;
  };
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session when widget opens
  useEffect(() => {
    if (isOpen && !sessionToken) {
      initializeSession();
    }
  }, [isOpen]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('chatSessionToken');
    if (savedToken) {
      setSessionToken(savedToken);
      loadHistory(savedToken);
    }
  }, []);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/chat/session/new', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setSessionToken(data.sessionToken);
        localStorage.setItem('chatSessionToken', data.sessionToken);
        
        // Add welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm here to help you find the perfect earrings. What are you looking for today?",
            timestamp: new Date(),
          },
        ]);
      } else {
        setError('Failed to start chat session');
      }
    } catch (err) {
      console.error('Session initialization error:', err);
      setError('Failed to connect to chat');
    }
  };

  const loadHistory = async (token: string) => {
    try {
      const response = await fetch(`/api/chat/history?sessionToken=${token}`);
      const data = await response.json();

      if (data.success && data.messages.length > 0) {
        setMessages(
          data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const sendMessage = async (content: string) => {
    if (!sessionToken || !content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          message: content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          functionCall: data.functionCalls?.[0],
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionToken(null);
    localStorage.removeItem('chatSessionToken');
    setIsOpen(false);
  };

  /** Shared chat header bar */
  const chatHeader = (
    <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full" />
        <h3 className="font-semibold">Chat with us</h3>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={clearChat}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white"
          title="Clear chat"
          aria-label="Clear chat history"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        {/* Close button only on desktop; mobile uses drawer swipe/overlay */}
        {!isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Close chat"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );

  /** Shared messages + input area */
  const chatBody = (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={isLoading || !sessionToken} />
    </>
  );

  // ─── Mobile: bottom Drawer ───────────────────────────────
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <button
            className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full min-h-[56px] min-w-[56px] flex items-center justify-center shadow-lg z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </DrawerTrigger>

        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Chat</DrawerTitle>
            <DrawerDescription>Chat with our earring advisor</DrawerDescription>
          </DrawerHeader>
          {chatHeader}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {chatBody}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // ─── Desktop: floating window ────────────────────────────
  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full min-h-[56px] min-w-[56px] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Desktop Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {chatHeader}
          {chatBody}
        </div>
      )}
    </>
  );
}
