import React from 'react'
import ChatWidget from './components/Chatbot/ChatWidget'
import './App.css'

function App() {
  // Optional configuration that can be passed from parent/SDK
  const config = window.VetChatbotConfig || {};

  return (
    <div className="App">
      <div className="demo-page">
        <h1>Veterinary Clinic</h1>
        <p>Welcome to our veterinary clinic website. Our chat assistant is available to help you!</p>

        <div className="demo-content">
          <h2>Our Services</h2>
          <ul>
            <li>Pet Health Checkups</li>
            <li>Vaccinations</li>
            <li>Emergency Care</li>
            <li>Pet Nutrition Counseling</li>
            <li>Dental Care</li>
          </ul>

          <h2>Try Our Chat Assistant</h2>
          <p>Click the chat button in the bottom right corner to:</p>
          <ul>
            <li>Ask questions about pet care</li>
            <li>Get veterinary advice</li>
            <li>Book an appointment</li>
          </ul>
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatWidget config={config} />
    </div>
  )
}

export default App
