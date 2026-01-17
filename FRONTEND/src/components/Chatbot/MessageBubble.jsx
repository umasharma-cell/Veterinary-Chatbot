import React from 'react';

const MessageBubble = ({ message, onButtonClick }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleButtonClick = (action) => {
    if (action === 'CONFIRM_CHAT_APPOINTMENT' && message.appointmentData) {
      onButtonClick('CONFIRM_CHAT_APPOINTMENT', message.appointmentData);
    } else if (action === 'RESTART_BOOKING') {
      onButtonClick('RESTART_BOOKING');
    } else {
      onButtonClick(action);
    }
  };

  return (
    <div className={`message-bubble ${message.role}`}>
      <div className={`message-content ${message.isError ? 'error' : ''}`}>
        {message.isTyping ? (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          message.content
        )}
      </div>
      {!message.isTyping && message.buttons && message.buttons.length > 0 && (
        <div className="message-buttons">
          {message.buttons.map((button, index) => (
            <button
              key={index}
              className={`chat-action-button ${button.style || 'primary'}`}
              onClick={() => handleButtonClick(button.action)}
            >
              {button.text}
            </button>
          ))}
        </div>
      )}
      {!message.isTyping && (
        <div className="message-time">
          {formatTime(message.timestamp)}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;