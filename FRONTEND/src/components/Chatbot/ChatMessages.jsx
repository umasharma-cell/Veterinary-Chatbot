import React from 'react';
import MessageBubble from './MessageBubble';
import Loader from './Loader';

const ChatMessages = ({ messages, isLoading, messagesEndRef }) => {
  return (
    <div className="chat-messages">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
        />
      ))}
      {isLoading && <Loader />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;