import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';

interface CommandInfo {
  command: string;
  description: string;
}

interface CustomTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  showCommandSelector: boolean;
  commandSelectedIndex: number;
  filteredCommands: CommandInfo[];
  onCommandNavigate: (direction: 'up' | 'down') => void;
  onCommandSelect: () => void;
  onCommandCancel: () => void;
  showConversationSelector: boolean;
  conversationSelectedIndex: number;
  onConversationNavigate: (direction: 'up' | 'down') => void;
  onConversationSelect: () => void;
  onConversationCancel: () => void;
}

export default function CustomTextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  showCommandSelector,
  commandSelectedIndex,
  filteredCommands,
  onCommandNavigate,
  onCommandSelect,
  onCommandCancel,
  showConversationSelector,
  conversationSelectedIndex,
  onConversationNavigate,
  onConversationSelect,
  onConversationCancel
}: CustomTextInputProps) {
  const [isFocused, setIsFocused] = useState(true);

  useInput(
    useCallback(
      (input, key) => {
        if (!isFocused) return;

        if (showCommandSelector) {
          // Handle command selector navigation
          if (key.upArrow) {
            onCommandNavigate('up');
            return;
          }
          
          if (key.downArrow) {
            onCommandNavigate('down');
            return;
          }
          
          if (key.return) {
            onCommandSelect();
            return;
          }
          
          if (key.escape) {
            onCommandCancel();
            return;
          }
        } else if (showConversationSelector) {
          // Handle conversation selector navigation
          if (key.upArrow) {
            onConversationNavigate('up');
            return;
          }
          
          if (key.downArrow) {
            onConversationNavigate('down');
            return;
          }
          
          if (key.return) {
            onConversationSelect();
            return;
          }
          
          if (key.escape) {
            onConversationCancel();
            return;
          }
        } else {
          // Normal text input handling when command selector is not shown
          if (key.return) {
            onSubmit(value);
            return;
          }
        }

        // Handle text input
        if (key.backspace || key.delete) {
          if (value.length > 0) {
            onChange(value.slice(0, -1));
          }
        } else if (input && !key.ctrl && !key.meta) {
          // Regular character input
          onChange(value + input);
        }
      },
      [
        isFocused,
        showCommandSelector,
        showConversationSelector,
        value,
        onChange,
        onSubmit,
        onCommandNavigate,
        onCommandSelect,
        onCommandCancel,
        onConversationNavigate,
        onConversationSelect,
        onConversationCancel
      ]
    )
  );

  return (
    <Box>
      <Text>{value}</Text>
      {value === '' && <Text color="gray" dimColor>{placeholder}</Text>}
    </Box>
  );
}