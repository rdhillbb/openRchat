import React from 'react';
import { Box, Text, Newline } from 'ink';
import { Message } from '../api.js';

interface ConversationMessage extends Message {
  timestamp: Date;
}

interface ConversationViewProps {
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

export default function ConversationView({ messages, isLoading, error, successMessage }: ConversationViewProps) {
  const displayMessages = messages.filter(msg => msg.role !== 'system');


  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
      {displayMessages.length === 0 && (
        <Box>
          <Text color="gray">Welcome to OpenRouter CLI! Type your message or use commands like /help, /swmodel, /save, /load, /listchats, /newchat, /exit</Text>
        </Box>
      )}
      
      {displayMessages.map((message, index) => (
        <Box key={index} flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={message.role === 'user' ? 'blue' : 'green'} bold>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </Text>
            <Text color="gray"> ({message.timestamp.toLocaleTimeString()})</Text>
          </Box>
          
          <Box paddingLeft={2}>
            <Text>{message.content}</Text>
          </Box>
        </Box>
      ))}
      
      {isLoading && (
        <Box>
          <Text color="yellow">Assistant is typing...</Text>
        </Box>
      )}
      
      {error && (
        <Box>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
      
      {successMessage && (
        <Box>
          <Text color="green">✓ {successMessage}</Text>
        </Box>
      )}
    </Box>
  );
}