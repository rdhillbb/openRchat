import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Model } from '../config.js';

interface ModelSelectorProps {
  models: Model[];
  currentModel: Model;
  onSelect: (model: Model) => void;
  onAddModel: (modelId: string, modelName: string) => void;
  onCancel: () => void;
}

export default function ModelSelector({ 
  models, 
  currentModel, 
  onSelect, 
  onAddModel, 
  onCancel 
}: ModelSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [addingId, setAddingId] = useState(true);

  useInput((input, key) => {
    if (showAddForm) return;
    
    if ((key.leftArrow || key.upArrow) && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if ((key.rightArrow || key.downArrow) && selectedIndex < models.length) {
      setSelectedIndex(selectedIndex + 1);
    } else if (key.return) {
      if (selectedIndex === models.length) {
        setShowAddForm(true);
      } else {
        onSelect(models[selectedIndex]);
      }
    } else if (key.escape) {
      onCancel();
    }
  }, { isActive: !showAddForm });

  useInput((input, key) => {
    if (key.escape && showAddForm) {
      setShowAddForm(false);
      setNewModelId('');
      setNewModelName('');
      setAddingId(true);
    }
  }, { isActive: showAddForm });

  if (showAddForm) {
    return (
      <Box flexDirection="column" padding={2}>
        <Text bold>Add New Model</Text>
        <Box marginY={1}>
          <Text>Model ID: </Text>
          {addingId ? (
            <TextInput
              value={newModelId}
              onChange={setNewModelId}
              onSubmit={() => setAddingId(false)}
              placeholder="e.g., openai/gpt-4"
            />
          ) : (
            <Text>{newModelId}</Text>
          )}
        </Box>
        
        {!addingId && (
          <Box marginY={1}>
            <Text>Model Name: </Text>
            <TextInput
              value={newModelName}
              onChange={setNewModelName}
              onSubmit={() => {
                if (newModelId && newModelName) {
                  onAddModel(newModelId, newModelName);
                  setShowAddForm(false);
                  setNewModelId('');
                  setNewModelName('');
                  setAddingId(true);
                }
              }}
              placeholder="e.g., GPT-4"
            />
          </Box>
        )}
        
        <Box marginTop={1}>
          <Text color="gray">Press Esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={2}>
      <Text bold>Select Model</Text>
      
      <Box marginY={1} flexDirection="row" flexWrap="wrap">
        {models.map((model, index) => (
          <Box key={`${model.id}-${index}`} marginRight={2} marginBottom={1}>
            <Text 
              color={selectedIndex === index ? 'blue' : 'white'}
              bold={selectedIndex === index}
            >
              {selectedIndex === index ? '> ' : '  '}
              {model.name}
              {model.id === currentModel.id ? ' (current)' : ''}
            </Text>
          </Box>
        ))}
        
        <Box key="add-new-model" marginRight={2} marginBottom={1}>
          <Text 
            color={selectedIndex === models.length ? 'blue' : 'gray'}
            bold={selectedIndex === models.length}
          >
            {selectedIndex === models.length ? '> ' : '  '}
            Add new model...
          </Text>
        </Box>
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray">Use ←/→ or ↑/↓ to navigate, Enter to select, Esc to cancel</Text>
      </Box>
    </Box>
  );
}