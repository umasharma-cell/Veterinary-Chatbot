import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import AppointmentForm from './AppointmentForm';
import StorageService from '../../services/StorageService';
import './ChatWidget.css';

const ChatWidget = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [awaitingAppointmentConfirmation, setAwaitingAppointmentConfirmation] = useState(false);
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

    // Load user profile if exists
    const userProfile = StorageService.getUserProfile();

    // Add personalized welcome message
    if (messages.length === 0) {
      let welcomeContent = 'Hello! I\'m your veterinary assistant. I can help you with pet care questions or book an appointment.';

      if (userProfile && userProfile.ownerName && userProfile.petName) {
        welcomeContent = `Welcome back, ${userProfile.ownerName}! I\'m here to help with ${userProfile.petName}'s care.`;

        // Check for upcoming appointments
        const upcomingAppointments = StorageService.getUpcomingAppointments();
        if (upcomingAppointments.length > 0) {
          const nextApt = upcomingAppointments[0];
          welcomeContent += ` I see you have an appointment on ${nextApt.appointmentDate} at ${nextApt.appointmentTime}.`;
        }
      }

      welcomeContent += ' How can I assist you today?';

      setMessages([{
        id: 'welcome',
        role: 'bot',
        content: welcomeContent,
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

    const lowerMessage = message.toLowerCase();

    // Check if user is responding to appointment suggestion
    if (awaitingAppointmentConfirmation) {
      if (lowerMessage.includes('yes') || lowerMessage.includes('sure') ||
          lowerMessage.includes('ok') || lowerMessage.includes('please')) {
        setShowAppointmentForm(true);
        setAwaitingAppointmentConfirmation(false);

        // Add confirmation message
        const confirmMessage = {
          id: `msg-${Date.now()}-bot`,
          role: 'bot',
          content: 'Great! Please fill out the appointment form.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmMessage]);
        return;
      } else {
        setAwaitingAppointmentConfirmation(false);
      }
    }

    // Check for direct appointment requests
    const appointmentKeywords = ['appointment', 'book', 'schedule', 'meet', 'visit', 'consultation'];
    const isAppointmentRequest = appointmentKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isAppointmentRequest && (lowerMessage.includes('want') || lowerMessage.includes('need') ||
        lowerMessage.includes('like') || lowerMessage.includes('book') || lowerMessage.includes('schedule'))) {
      // Add user message first
      const userMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      // Add acknowledgment message
      const ackMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'bot',
        content: 'I\'ll help you book an appointment. Please fill out the form with your details.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, ackMessage]);

      setShowAppointmentForm(true);
      setAppointmentReason('');
      return;
    }

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Save message to localStorage
    StorageService.saveChatMessage(userMessage);

    setIsLoading(true);

    try {
      // First, wake up the server if it's sleeping (Render free tier)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      // Try to wake up the server with a health check first
      try {
        await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout for health check
        });
      } catch (healthError) {
        console.log('Server might be waking up...');
      }

      // Get context for AI from localStorage
      const aiContext = StorageService.getContextForAI();

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
          context: {
            ...(config || {}),
            userProfile: aiContext.userProfile,
            appointments: aiContext.appointments,
            recentConversation: aiContext.recentConversation
          }
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

        // Save bot response to localStorage
        StorageService.saveChatMessage(botMessage);

        // Check if bot is suggesting appointment
        const botSuggestion = data.message.toLowerCase();
        const healthIssueKeywords = ['vomit', 'sick', 'fever', 'pain', 'injury', 'bleeding',
                                     'diarrhea', 'lethargy', 'appetite', 'breathing', 'swollen'];
        const hasHealthIssue = healthIssueKeywords.some(keyword => message.toLowerCase().includes(keyword));

        if (hasHealthIssue && !awaitingAppointmentConfirmation) {
          // Add appointment suggestion
          const suggestionMessage = {
            id: `msg-${Date.now()}-suggest`,
            role: 'bot',
            content: 'I recommend scheduling an appointment with a veterinarian for proper examination. Would you like me to help you book an appointment?',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, suggestionMessage]);
          setAwaitingAppointmentConfirmation(true);
          setAppointmentReason(message);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);

      // Check if it's a network/connection error
      const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('Network');

      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'bot',
        content: isNetworkError
          ? 'The server is waking up (this may take a few seconds on first use). Please try your message again in a moment.'
          : 'I apologize, but I\'m having trouble processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppointmentSubmit = async (formData) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      // Send appointment data to backend
      const response = await fetch(`${apiUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sessionId,
          createdAt: new Date()
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Save appointment to localStorage
        const savedAppointment = StorageService.saveAppointment({
          ...formData,
          id: data.appointment?.id || `apt_${Date.now()}`,
          status: 'pending'
        });

        // Add success message to chat
        const successMessage = {
          id: `msg-${Date.now()}-success`,
          role: 'bot',
          content: `Great news! Your appointment has been successfully booked for ${formData.appointmentDate} at ${formData.appointmentTime}. We'll send a confirmation to ${formData.email} and call you at ${formData.fullPhoneNumber} to confirm.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
        StorageService.saveChatMessage(successMessage);

        // Reset appointment form state
        setShowAppointmentForm(false);
        setAppointmentReason('');
        setAwaitingAppointmentConfirmation(false);
        setAppointmentState('COMPLETED');
      } else {
        throw new Error(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Appointment booking error:', error);

      // Add error message to chat
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'bot',
        content: 'I apologize, but there was an error booking your appointment. Please try again or contact us directly at (555) 123-4567.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);

      // Keep form open so user can retry
      throw error;
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
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                  fill="none"
                  stroke="#666666"
                  strokeWidth="1.5"/>
            <circle cx="8" cy="9.5" r="1" fill="#666666">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="12" cy="9.5" r="1" fill="#666666">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
            </circle>
            <circle cx="16" cy="9.5" r="1" fill="#666666">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
            </circle>
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

      {/* Appointment Form Modal */}
      <AppointmentForm
        isOpen={showAppointmentForm}
        onClose={() => {
          setShowAppointmentForm(false);
          setAwaitingAppointmentConfirmation(false);
        }}
        onSubmit={handleAppointmentSubmit}
        triggerReason={appointmentReason}
      />
    </>
  );
};

export default ChatWidget;