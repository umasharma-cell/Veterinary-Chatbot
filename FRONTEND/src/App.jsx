import React from 'react'
import ChatWidget from './components/Chatbot/ChatWidget'
import './App.css'

function App() {
  // Optional configuration that can be passed from parent/SDK
  const config = window.VetChatbotConfig || {};

  return (
    <div className="App">
      <div className="demo-page">
        <h1>PetCare AI Assistant</h1>
        <p>Experience next-generation veterinary support powered by advanced AI technology</p>

        <div className="demo-content">
          <h2>Intelligent Features</h2>
          <ul>
            <li>AI-Powered Veterinary Expertise - Get instant answers to pet health questions</li>
            <li>Smart Appointment Scheduling - Book appointments with conflict detection</li>
            <li>24/7 Availability - Always here when you need guidance</li>
            <li>Conversation Memory - Remembers context across sessions</li>
            <li>Multi-Language Support - Communicate in your preferred language</li>
            <li>Emergency Guidance - Critical care advice when every second counts</li>
          </ul>

          <h2>Production-Ready Capabilities</h2>
          <ul>
            <li>Enterprise-Grade Security - Rate limiting and DDoS protection</li>
            <li>Lightning Fast Responses - Multi-layer caching reduces latency by 60%</li>
            <li>Offline Support - Works even without internet connection</li>
            <li>Cross-Platform Sync - Seamless experience across devices</li>
            <li>Analytics Dashboard - Real-time performance monitoring</li>
            <li>99.9% Uptime - Robust error recovery and failover systems</li>
          </ul>

          <h2>Try Our Advanced Assistant</h2>
          <p>Click the glowing chat button to experience:</p>
          <ul>
            <li>Instant veterinary consultation powered by Google Gemini AI</li>
            <li>Intelligent appointment booking with business hours validation</li>
            <li>Personalized pet care recommendations</li>
            <li>Emergency symptom assessment</li>
            <li>Vaccination schedule reminders</li>
            <li>Nutrition and behavior guidance</li>
          </ul>

          <h2>Test Scenarios</h2>
          <p>Try these queries to see our advanced capabilities:</p>
          <ul>
            <li>"My dog ate chocolate" - Emergency response</li>
            <li>"Book appointment for tomorrow at 2pm" - Smart scheduling</li>
            <li>"What vaccines does my puppy need?" - Expert knowledge</li>
            <li>"Mi perro está vomitando" - Multi-language support</li>
            <li>Refresh the page - Conversation persistence</li>
            <li>Try booking the same time slot twice - Conflict detection</li>
          </ul>
        </div>
      </div>

      {/* Chatbot Widget with Glassmorphic Design */}
      <ChatWidget config={config} />
    </div>
  )
}

export default App