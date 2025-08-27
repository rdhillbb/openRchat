import React from 'react';
import { Box, Text } from 'ink';

interface SavedConversationInfo {
  filename: string;
  displayName: string;
  timestamp: string;
  messageCount: number;
  model: string;
  days: number;
}

interface ConversationSelectorInlineProps {
  conversations: SavedConversationInfo[];
  selectedIndex: number;
}

export default function ConversationSelectorInline({ 
  conversations, 
  selectedIndex 
}: ConversationSelectorInlineProps) {
  if (conversations.length === 0) {
    return (
      <Box paddingLeft={1}>
        <Text color="yellow">No saved conversations found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Box marginBottom={1}>
        <Text color="cyan">Load Conversation (↑↓: Navigate • Enter: Load • Esc: Cancel)</Text>
      </Box>
      {conversations.map((conv, index) => (
        <Box key={conv.filename}>
          <Text 
            color={index === selectedIndex ? 'green' : 'gray'}
            backgroundColor={index === selectedIndex ? 'black' : undefined}
          >
            {conv.displayName.padEnd(35)} 
            {conv.days <= 5 ? `${conv.days}d` : conv.timestamp} 
            • {conv.messageCount} msgs 
            • {conv.model.split('/')[1] || conv.model}
          </Text>
        </Box>
      ))}
    </Box>
  );
}