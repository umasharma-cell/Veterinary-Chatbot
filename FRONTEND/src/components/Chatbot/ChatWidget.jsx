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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
            <path d="M7 9H17V11H7V9ZM7 13H13V15H7V13Z" fill="#4CAF50"/>
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