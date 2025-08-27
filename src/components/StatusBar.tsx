import React from 'react';
import { Box, Text } from 'ink';
import { Model } from '../config.js';

interface StatusBarProps {
  currentModel: Model;
  messageCount: number;
  isLoading: boolean;
}

export default function StatusBar({ currentModel, messageCount, isLoading }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderTop paddingX={1} justifyContent="space-between">
      <Box>
        <Text color="cyan">Model: </Text>
        <Text bold>{currentModel.name}</Text>
        <Text color="gray"> | Messages: {messageCount}</Text>
      </Box>
      
      <Box>
        <Text color="gray">
          Commands: /help /swmodel /save /load /listchats /newchat /exit
          {isLoading && <Text color="yellow"> | Loading...</Text>}
        </Text>
      </Box>
    </Box>
  );
}
