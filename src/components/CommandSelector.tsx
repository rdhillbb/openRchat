import React from 'react';
import { Box, Text } from 'ink';

interface CommandInfo {
  command: string;
  description: string;
}

interface CommandSelectorProps {
  commands: CommandInfo[];
  selectedIndex: number;
  input: string;
}

export default function CommandSelector({ commands, selectedIndex, input }: CommandSelectorProps) {
  if (commands.length === 0) {
    return null; // Don't show anything if no matches
  }

  return (
    <Box flexDirection="column" paddingLeft={1}>
      {commands.map((commandInfo, index) => (
        <Box key={commandInfo.command}>
          <Text 
            color={index === selectedIndex ? 'green' : 'gray'}
            backgroundColor={index === selectedIndex ? 'black' : undefined}
          >
            {commandInfo.command.padEnd(20)} {commandInfo.description}
          </Text>
        </Box>
      ))}
    </Box>
  );
}