import React from 'react'
import ChatWidget from './components/Chatbot/ChatWidget'
import './App.css'

function App() {
  // Optional configuration that can be passed from parent/SDK
  const config = window.VetChatbotConfig || {};

  return (
    <div className="App">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">AI-Powered Veterinary Care</div>
          <h1 className="hero-title">
            Your Pet's Health,<br />
            <span className="hero-gradient">Simplified</span>
          </h1>
          <p className="hero-subtitle">
            Get instant veterinary guidance, book appointments, and receive personalized pet care advice - all powered by advanced AI technology.
          </p>

          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🏥</div>
              <h3>24/7 Veterinary Support</h3>
              <p>Instant answers to your pet health questions, any time of day or night</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📅</div>
              <h3>Smart Scheduling</h3>
              <p>Book appointments seamlessly through chat or our intuitive form</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Care</h3>
              <p>Tailored recommendations based on your pet's specific needs</p>
            </div>
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <h3>Emergency Guidance</h3>
              <p>Quick, reliable advice when every second counts</p>
            </div>
          </div>

          <div className="cta-section">
            <p className="cta-text">Ready to get started?</p>
            <p className="cta-hint">Click the chat icon in the bottom-right corner</p>
            <div className="arrow-down">↓</div>
          </div>
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatWidget config={config} />
    </div>
  )
}

export default App