import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import './ChatWidget.css';

const ChatWidget = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [appointmentState, setAppointmentState] = useState('NONE');
  const messagesEndRef = useRef(null);

  // Generate or retrieve session ID
  useEffect(() => {
    const storedSessionId = localStorage.getItem('vet-chatbot-session');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      loadConversationHistory(storedSessionId);
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      localStorage.setItem('vet-chatbot-session', newSessionId);
    }

    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        content: 'Hello! I\'m your veterinary assistant. I can help you with pet care questions or book an appointment. How can I assist you today?',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const loadConversationHistory = async (sessionId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chat/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((msg, index) => ({
            ...msg,
            id: `msg-${index}`,
            timestamp: new Date(msg.timestamp)
          })));
          setAppointmentState(data.appointmentState || 'NONE');
        }
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
          context: config || {}
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Add bot response
        const botMessage = {
          id: `msg-${Date.now()}-bot`,
          role: 'bot',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setAppointmentState(data.appointmentState || 'NONE');
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'bot',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'bot',
      content: 'Hello! How can I help you with your pet\'s needs today?',
      timestamp: new Date()
    }]);
    setAppointmentState('NONE');

    // Generate new session
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    localStorage.setItem('vet-chatbot-session', newSessionId);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          className="chat-toggle-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Robot Head */}
            <circle cx="16" cy="14" r="10" fill="url(#gradient1)" stroke="white" strokeWidth="2"/>
            {/* Robot Eyes */}
            <circle cx="12" cy="12" r="2.5" fill="white">
              <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="20" cy="12" r="2.5" fill="white">
              <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite" begin="0.2s"/>
            </circle>
            {/* Robot Pupils */}
            <circle cx="12" cy="12" r="1" fill="#1a237e"/>
            <circle cx="20" cy="12" r="1" fill="#1a237e"/>
            {/* Robot Mouth */}
            <rect x="12" y="17" width="8" height="2" rx="1" fill="white"/>
            {/* Robot Antenna */}
            <rect x="15" y="2" width="2" height="4" fill="url(#gradient2)"/>
            <circle cx="16" cy="2" r="1.5" fill="#ffd700">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite"/>
            </circle>
            {/* Chat Bubble */}
            <path d="M24 18C24 17.4477 24.4477 17 25 17H29C29.5523 17 30 17.4477 30 18V24C30 24.5523 29.5523 25 29 25H27L25 27V25H25C24.4477 25 24 24.5523 24 24V18Z"
                  fill="url(#gradient3)"
                  fillOpacity="0.9">
              <animate attributeName="fill-opacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite"/>
            </path>
            {/* Chat Dots */}
            <circle cx="26" cy="21" r="0.5" fill="white"/>
            <circle cx="27.5" cy="21" r="0.5" fill="white"/>
            <circle cx="29" cy="21" r="0.5" fill="white"/>
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea"/>
                <stop offset="100%" stopColor="#764ba2"/>
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f093fb"/>
                <stop offset="100%" stopColor="#f5576c"/>
              </linearGradient>
              <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#13B955"/>
                <stop offset="100%" stopColor="#06D6A0"/>
              </linearGradient>
            </defs>
          </svg>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="chat-widget">
          <ChatHeader
            onClose={() => setIsOpen(false)}
            onClear={handleClearChat}
          />
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder={
              appointmentState !== 'NONE' && appointmentState !== 'COMPLETED'
                ? 'Type your response...'
                : 'Ask about pet care or book an appointment...'
            }
          />
        </div>
      )}
    </>
  );
};

export default ChatWidget;