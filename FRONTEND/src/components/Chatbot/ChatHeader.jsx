import React from 'react';

const ChatHeader = ({ onClose, onClear }) => {
  return (
    <div className="chat-header">
      <div className="chat-header-title">
        <span className="chat-header-icon">🐾</span>
        <span>Veterinary Assistant</span>
      </div>
      <div className="chat-header-actions">
        <button
          className="chat-header-button"
          onClick={onClear}
          title="Clear chat"
          aria-label="Clear chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" fill="currentColor"/>
          </svg>
        </button>
        <button
          className="chat-header-button"
          onClick={onClose}
          title="Minimize chat"
          aria-label="Minimize chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13H5V11H19V13Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;