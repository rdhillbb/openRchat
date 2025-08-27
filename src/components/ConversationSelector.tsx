import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';

interface SavedConversationInfo {
  filename: string;
  displayName: string;
  timestamp: string;
  messageCount: number;
  model: string;
  days: number;
}

interface ConversationSelectorProps {
  conversations: SavedConversationInfo[];
  onSelect: (filename: string) => void;
  onCancel: () => void;
}

export default function ConversationSelector({ 
  conversations, 
  onSelect, 
  onCancel 
}: ConversationSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput(
    useCallback(
      (input, key) => {
        if (key.upArrow) {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : conversations.length - 1
          );
        } else if (key.downArrow) {
          setSelectedIndex(prev => 
            prev < conversations.length - 1 ? prev + 1 : 0
          );
        } else if (key.return) {
          if (conversations[selectedIndex]) {
            onSelect(conversations[selectedIndex].filename);
          }
        } else if (key.escape) {
          onCancel();
        }
      },
      [conversations, selectedIndex, onSelect, onCancel]
    )
  );

  if (conversations.length === 0) {
    return (
      <Box flexDirection="column" padding={2}>
        <Box borderStyle="single" paddingX={2} paddingY={1}>
          <Text color="yellow">No saved conversations found</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press Esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="single" paddingX={2} paddingY={1}>
        <Text color="cyan" bold>Load Conversation</Text>
      </Box>
      
      <Box marginTop={1} marginBottom={1}>
        <Text color="gray">↑↓: Navigate • Enter: Load • Esc: Cancel</Text>
      </Box>
      
      <Box flexDirection="column" borderStyle="single" paddingX={1}>
        {conversations.map((conv, index) => (
          <Box key={conv.filename} paddingY={0}>
            <Text
              inverse={index === selectedIndex}
              color={index === selectedIndex ? 'black' : 'white'}
            >
              {conv.displayName.padEnd(30)} 
              <Text color={index === selectedIndex ? 'black' : 'gray'}>
                {conv.days <= 5 ? `${conv.days}d` : conv.timestamp} 
                • {conv.messageCount} msgs 
                • {conv.model.split('/')[1] || conv.model}
              </Text>
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}