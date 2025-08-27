import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text } from 'ink';
import { Message } from '../api.js';
import { Model } from '../config.js';
import ConversationView from './ConversationView.js';
import StatusBar from './StatusBar.js';
import ModelSelector from './ModelSelector.js';
import CommandSelector from './CommandSelector.js';
import CustomTextInput from './CustomTextInput.js';
import ConversationSelector from './ConversationSelector.js';
import ConversationSelectorInline from './ConversationSelectorInline.js';

interface ChatAppProps {
  apiClient: any;
  config: any;
}

interface ConversationMessage extends Message {
  timestamp: Date;
}

interface SavedConversation {
  timestamp: string;
  model: string;
  systemPrompt: string;
  messages: ConversationMessage[];
  metadata: {
    messageCount: number;
    aiGeneratedName: string;
  };
}

interface PastedItem {
  id: number;
  text: string;
  createdAt: number;
}

interface ExpansionResult {
  expandedText: string;
  missingRefs: number[];
}

export default function ChatApp({ apiClient, config }: ChatAppProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      role: 'system',
      content: config.systemPrompt,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const pastedStoreRef = useRef<Map<number, PastedItem>>(new Map());
  const nextPasteIdRef = useRef(1);
  const [currentModel, setCurrentModel] = useState<Model>(config.models[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showCommandSelector, setShowCommandSelector] = useState(false);
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(0);
  interface CommandInfo {
    command: string;
    description: string;
  }
  
  const [filteredCommands, setFilteredCommands] = useState<CommandInfo[]>([]);
  const [showConversationSelector, setShowConversationSelector] = useState(false);
  const [availableConversations, setAvailableConversations] = useState<any[]>([]);
  const [showInlineConversationSelector, setShowInlineConversationSelector] = useState(false);
  const [conversationSelectedIndex, setConversationSelectedIndex] = useState(0);

  const PASTE_THRESHOLD = 256;
  const TOKEN_RE = /\[Pasted\s+Text\s+#(\d+)\]/g;

  const expandInputWithPastes = (rawInput: string): ExpansionResult => {
    const missingRefs: number[] = [];
    const expandedText = rawInput.replace(TOKEN_RE, (match, idStr) => {
      const id = Number(idStr);
      const item = pastedStoreRef.current.get(id);
      if (!item) {
        missingRefs.push(id);
        return match; // Keep original placeholder if not found
      }
      return item.text;
    });
    
    return { expandedText, missingRefs };
  };

  const handleInputChange = (value: string) => {
    const prevLength = input.length;
    const newLength = value.length;
    const lengthDiff = newLength - prevLength;
    
    // Detect potential paste: large sudden increase in text length
    if (lengthDiff >= PASTE_THRESHOLD) {
      // Extract the likely pasted portion
      const pastedText = value.slice(prevLength);
      
      // Store pasted content
      const id = nextPasteIdRef.current++;
      pastedStoreRef.current.set(id, {
        id,
        text: pastedText,
        createdAt: Date.now(),
      });
      
      // Create placeholder token
      const placeholder = `[Pasted Text #${id}]`;
      
      // Replace the pasted portion with placeholder
      const newValue = value.slice(0, prevLength) + placeholder;
      setInput(newValue);
      value = newValue;
    } else {
      setInput(value);
    }
    
    // Handle command completion
    if (value.startsWith('/')) {
      const partialCommand = value.slice(1).toLowerCase();
      const matches = availableCommands.filter(cmdInfo => 
        cmdInfo.command.slice(1).toLowerCase().startsWith(partialCommand)
      );
      
      setFilteredCommands(matches);
      setShowCommandSelector(matches.length > 0);
      setCommandSelectedIndex(0);
    } else {
      setShowCommandSelector(false);
      setFilteredCommands([]);
      setCommandSelectedIndex(0);
    }
  };

  const handleSubmit = useCallback(async (value: string) => {
    // If command selector is showing, don't process normal submit
    if (showCommandSelector) {
      return;
    }
    
    // Expand any pasted text placeholders
    const { expandedText, missingRefs } = expandInputWithPastes(value);
    
    if (missingRefs.length > 0) {
      setError(`Missing pasted text references: ${missingRefs.join(', ')}`);
      return;
    }
    
    const trimmedValue = expandedText.trim();
    if (!trimmedValue) return;

    // Handle slash commands
    if (trimmedValue.startsWith('/')) {
      await handleCommand(trimmedValue);
      setInput('');
      return;
    }

    // Create user message - show the raw input (with placeholders) in chat
    const userMessage: ConversationMessage = {
      role: 'user',
      content: value, // Show the input with placeholders in chat
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for API - expand any placeholders in the conversation
      const apiMessages: Message[] = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.role === 'user' ? expandInputWithPastes(msg.content).expandedText : msg.content,
      }));

      const response = await apiClient.sendMessage(currentModel.id, apiMessages);

      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [messages, currentModel, apiClient, expandInputWithPastes, showCommandSelector]);

  const availableCommands: CommandInfo[] = [
    { command: '/help', description: 'Show help message with all commands' },
    { command: '/swmodel', description: 'Switch AI model (opens interactive selector)' },
    { command: '/save', description: 'Save conversation with AI-generated filename' },
    { command: '/load', description: 'Load a previously saved conversation' },
    { command: '/listchats', description: 'List all saved conversations with dates' },
    { command: '/newchat', description: 'Save current conversation and start fresh' },
    { command: '/exit', description: 'Exit the application' }
  ];

  const handleCommandNavigate = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      setCommandSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else {
      setCommandSelectedIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handleCommandSelect = () => {
    const selectedCommandInfo = filteredCommands[commandSelectedIndex];
    if (selectedCommandInfo) {
      handleCommand(selectedCommandInfo.command);
      setInput('');
      setShowCommandSelector(false);
      setFilteredCommands([]);
      setCommandSelectedIndex(0);
    }
  };

  const handleCommandCancel = () => {
    setShowCommandSelector(false);
    setFilteredCommands([]);
    setCommandSelectedIndex(0);
  };

  const handleCommand = async (command: string) => {
    const [cmd, ...args] = command.split(' ');

    // Command completion is now handled by the CommandSelector UI

    switch (cmd) {
      case '/help':
        const helpMessage: ConversationMessage = {
          role: 'assistant',
          content: `Available commands:
• /help - Show this help message
• /swmodel - Switch AI model (opens interactive selector)
• /save - Save conversation with AI-generated filename to chats/ directory
• /load - Load a previously saved conversation (interactive selector)
• /listchats - List all saved conversations with creation dates
• /newchat - Save current conversation and start fresh
• /exit - Quit the application

Usage tips:
• Use arrow keys in selectors (Enter to select, Esc to cancel)
• Long text will show as [Pasted Text #N] but full content is sent to AI
• Save creates JSON files with format: <ai_generated_name>-YYYYMMDD-HHMMSSCC.json
• AI generates 3-4 word names with underscores, max 25 chars (displayed with spaces)
• Load restores complete conversation context and original model
• All conversations saved to ./chats/ directory automatically
• listchats shows days for recent files, full dates for older ones
• newchat automatically saves before clearing (no conversations lost)`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, helpMessage]);
        break;

      case '/exit':
        process.exit(0);
        break;
      
      case '/newchat':
        await startNewChat();
        break;
      
      case '/swmodel':
        setShowModelSelector(true);
        break;
      
      case '/save':
        await initiateAISave();
        break;

      case '/listchats':
        await listChats();
        break;
      
      case '/load':
        await showLoadConversationSelector();
        break;
      
      default:
        setError(`Unknown command: ${cmd}. Available commands: /help, /exit, /newchat, /swmodel, /save, /listchats, /load`);
    }
  };

  const initiateAISave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage('Analyzing conversation for naming...');

      // Send prompt to AI for name suggestion
      const namePromptMessage: ConversationMessage = {
        role: 'user',
        content: 'Create a filename for this conversation using exactly 3 to 4 words separated by underscores, maximum 25 characters total. Examples: python_debug_help, home_buying_advice, tax_strategy_tips. Reply with ONLY the underscore-separated name, no other text.',
        timestamp: new Date(),
      };

      // Add the prompt to messages temporarily for AI to see
      const messagesForAI: Message[] = [...messages, namePromptMessage].map(msg => ({
        role: msg.role,
        content: msg.role === 'user' ? expandInputWithPastes(msg.content).expandedText : msg.content,
      }));

      const aiResponse = await apiClient.sendMessage(currentModel.id, messagesForAI);
      
      // Extract and validate AI-suggested name
      const suggestedName = sanitizeFileName(aiResponse);
      const validatedName = validateFileName(suggestedName);
      
      // Generate timestamp with centisecond precision
      const timestamp = generatePreciseTimestamp();
      
      // Create final filename
      const filename = `${validatedName}-${timestamp}.json`;
      
      await saveConversationWithName(filename, validatedName);
      
    } catch (err) {
      setError(`Failed to get AI naming suggestion: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSuccessMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sanitizeFileName = (aiResponse: string): string => {
    // Extract the suggested name from AI response (remove any explanatory text)
    let name = aiResponse.trim();
    
    // Try to extract just the name if AI provided explanation
    const lines = name.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes('_') && !trimmed.includes(' ')) {
        name = trimmed;
        break;
      }
    }
    
    // If no underscore-separated name found, try to create one from the response
    if (!name.includes('_')) {
      // Look for key phrases or words in the response
      const words = name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
        .split(/\s+/) // Split on whitespace
        .filter(word => word.length > 2) // Keep words longer than 2 characters
        .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)) // Remove common stop words
        .slice(0, 4); // Take first 4 meaningful words
      
      if (words.length >= 3) {
        name = words.join('_');
        // Ensure it's within 25 character limit
        if (name.length > 25) {
          // Truncate words until under 25 characters
          while (words.length > 3 && name.length > 25) {
            words.pop();
            name = words.join('_');
          }
          // If still too long, use fallback
          if (name.length > 25) {
            name = 'general_chat';
          }
        }
      } else {
        name = 'general_chat';
      }
    }
    
    // Remove quotes if present
    name = name.replace(/['"]/g, '');
    
    // Keep only allowed characters: a-z, A-Z, 0-9, _
    name = name.replace(/[^a-zA-Z0-9_]/g, '');
    
    return name;
  };

  const validateFileName = (name: string): string => {
    if (!name || name.length === 0) {
      return 'general_chat';
    }
    
    // Count words (separated by underscores)
    const words = name.split('_').filter(word => word.length > 0);
    
    if (words.length < 3) {
      return 'general_chat';
    }
    
    if (words.length > 4) {
      // Take first 4 words
      name = words.slice(0, 4).join('_');
    }
    
    // Ensure it's within 25 character limit
    if (name.length > 25) {
      // Try with fewer words
      let finalWords = words.slice(0, 3);
      name = finalWords.join('_');
      
      // If still too long, use fallback
      if (name.length > 25) {
        name = 'general_chat';
      }
    }
    
    return name;
  };

  const generatePreciseTimestamp = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const centiseconds = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}${seconds}${centiseconds}`;
  };

  const saveConversationWithName = async (filename: string, aiGeneratedName: string = 'conversation') => {
    const fs = await import('fs');
    const path = await import('path');
    
    // Create chats directory if it doesn't exist
    const chatsDir = './chats';
    try {
      await fs.promises.mkdir(chatsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
    }
    
    // Create SavedConversation structure
    const savedConversation: SavedConversation = {
      timestamp: new Date().toISOString(),
      model: currentModel.id,
      systemPrompt: config.systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      metadata: {
        messageCount: messages.filter(msg => msg.role !== 'system').length,
        aiGeneratedName
      }
    };
    
    // Change extension to .json
    const jsonFilename = filename.replace('.md', '.json');
    const fullPath = path.join(chatsDir, jsonFilename);
    
    try {
      // Check for duplicate timestamps and handle
      let finalPath = fullPath;
      let counter = 1;
      while (await fileExists(finalPath)) {
        const nameWithoutExt = jsonFilename.replace('.json', '');
        finalPath = path.join(chatsDir, `${nameWithoutExt}_${String(counter).padStart(2, '0')}.json`);
        counter++;
      }
      
      await fs.promises.writeFile(finalPath, JSON.stringify(savedConversation, null, 2), 'utf-8');
      setSuccessMessage(`Conversation saved to ${finalPath}`);
      setError(null);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Failed to save conversation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSuccessMessage(null);
    }
  };

  const startNewChat = async () => {
    try {
      // Check if there are any non-system messages to save
      const hasMessages = messages.some(msg => msg.role !== 'system');
      
      // Store current messages for background saving
      const currentMessages = [...messages];
      
      // Clear messages IMMEDIATELY for instant UI response
      setMessages([
        {
          role: 'system',
          content: config.systemPrompt,
          timestamp: new Date(),
        },
      ]);
      
      setError(null);
      setSuccessMessage('Starting new chat...');
      setTimeout(() => setSuccessMessage(null), 1500);
      
      // Save previous conversation in the background if it had content
      if (hasMessages) {
        // Background save process
        setTimeout(async () => {
          try {
            setSuccessMessage('Saving previous conversation...');
            
            // Use the stored messages for AI naming
            const namePromptMessage: ConversationMessage = {
              role: 'user',
              content: 'Create a filename for this conversation using exactly 3 to 6 words separated by underscores. Examples: python_debugging_help, home_buying_advice, tax_strategy_planning. Reply with ONLY the underscore-separated name, no other text.',
              timestamp: new Date(),
            };

            const messagesForAI: Message[] = [...currentMessages, namePromptMessage].map(msg => ({
              role: msg.role,
              content: msg.role === 'user' ? expandInputWithPastes(msg.content).expandedText : msg.content,
            }));

            const aiResponse = await apiClient.sendMessage(currentModel.id, messagesForAI);
            
            // Extract and validate AI-suggested name
            const suggestedName = sanitizeFileName(aiResponse);
            const validatedName = validateFileName(suggestedName);
            
            // Generate timestamp with centisecond precision
            const timestamp = generatePreciseTimestamp();
            
            // Create final filename
            const filename = `${validatedName}-${timestamp}.json`;
            
            // Save with the original messages, not current empty state
            const fs = await import('fs');
            const path = await import('path');
            
            const chatsDir = './chats';
            try {
              await fs.promises.mkdir(chatsDir, { recursive: true });
            } catch (err) {
              // Directory might already exist
            }
            
            const savedConversation = {
              timestamp: new Date().toISOString(),
              model: currentModel.id,
              systemPrompt: config.systemPrompt,
              messages: currentMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
              })),
              metadata: {
                messageCount: currentMessages.filter(msg => msg.role !== 'system').length,
                aiGeneratedName: validatedName
              }
            };
            
            const fullPath = path.join(chatsDir, filename);
            await fs.promises.writeFile(fullPath, JSON.stringify(savedConversation, null, 2), 'utf-8');
            
            setSuccessMessage(`Previous conversation saved as: ${validatedName.replace(/_/g, ' ')}`);
            setTimeout(() => setSuccessMessage(null), 3000);
          } catch (err) {
            setError(`Failed to save previous conversation: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setTimeout(() => setError(null), 3000);
          }
        }, 100); // Small delay to let UI update first
      }
      
    } catch (err) {
      setError(`Failed to start new chat: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const fileExists = async (filepath: string): Promise<boolean> => {
    const fs = await import('fs');
    try {
      await fs.promises.access(filepath);
      return true;
    } catch {
      return false;
    }
  };

  const listChats = async () => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const chatsDir = './chats';
      
      // Check if chats directory exists
      if (!await fileExists(chatsDir)) {
        const noChatsMessage: ConversationMessage = {
          role: 'assistant',
          content: 'No chat files found. The ./chats/ directory does not exist yet.\nUse /save to create your first chat file.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, noChatsMessage]);
        return;
      }

      // Read all files in chats directory
      const files = await fs.promises.readdir(chatsDir);
      const chatFiles = files.filter(file => file.endsWith('.json'));

      if (chatFiles.length === 0) {
        const noChatsMessage: ConversationMessage = {
          role: 'assistant',
          content: 'No chat files found in ./chats/ directory.\nUse /save to create your first chat file.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, noChatsMessage]);
        return;
      }

      // Process each file to extract name and date
      const chatList: Array<{name: string, days: number, dateStr: string, fullFilename: string}> = [];

      for (const file of chatFiles) {
        const chatInfo = parseChatFilename(file);
        if (chatInfo) {
          chatList.push(chatInfo);
        }
      }

      // Sort by date (newest first)
      chatList.sort((a, b) => a.days - b.days);

      // Format the list
      let listContent = 'Saved Conversations:\n\n';
      
      if (chatList.length === 0) {
        listContent += 'No valid chat files found with the expected naming format.\n';
      } else {
        // Find the longest display name for alignment
        const maxNameLength = Math.max(...chatList.map(chat => chat.name.replace(/_/g, ' ').length));
        
        for (const chat of chatList) {
          // Display name with spaces instead of underscores
          const displayName = chat.name.replace(/_/g, ' ');
          const paddedName = displayName.padEnd(maxNameLength);
          const timeInfo = chat.days <= 5 ? `${chat.days} days` : chat.dateStr;
          listContent += `${paddedName}   ${timeInfo}\n`;
        }
      }

      const listMessage: ConversationMessage = {
        role: 'assistant',
        content: listContent,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, listMessage]);
      
    } catch (err) {
      setError(`Failed to list chats: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const parseChatFilename = (filename: string): {name: string, days: number, dateStr: string, fullFilename: string} | null => {
    // Expected format: Name-YYYYMMDD-HHMMSSCC.json (updated for JSON)
    const match = filename.match(/^(.+)-(\d{8})-(\d{8})\.json$/);
    
    if (!match) {
      return null;
    }

    const [, name, dateStr, timeStr] = match;
    
    // Parse the date: YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-based in JS
    const day = parseInt(dateStr.substring(6, 8));
    
    // Parse the time: HHMMSSCC
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    const seconds = parseInt(timeStr.substring(4, 6));
    const centiseconds = parseInt(timeStr.substring(6, 8));
    const milliseconds = centiseconds * 10;
    
    const fileDate = new Date(year, month, day, hours, minutes, seconds, milliseconds);
    const now = new Date();
    
    // Calculate days difference
    const diffTime = now.getTime() - fileDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Format date string for files older than 5 days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[fileDate.getDay()];
    const formattedDate = `${dayName} ${day}/${month + 1}/${year}`;
    
    return {
      name,
      days: diffDays,
      dateStr: formattedDate,
      fullFilename: filename
    };
  };

  const handleModelSelect = (model: Model) => {
    setCurrentModel(model);
    setShowModelSelector(false);
  };

  const handleAddModel = async (modelId: string, modelName: string) => {
    const newModel: Model = { id: modelId, name: modelName };
    config.models.push(newModel);
    
    try {
      const { ConfigLoader } = await import('../config.js');
      const configLoader = new ConfigLoader();
      await configLoader.saveModels(config.models);
    } catch (err) {
      setError(`Failed to save new model: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const showLoadConversationSelector = async () => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const chatsDir = './chats';
      
      // Check if chats directory exists
      if (!await fileExists(chatsDir)) {
        setError('No saved conversations found. The ./chats/ directory does not exist.');
        return;
      }

      // Read all JSON files in chats directory
      const files = await fs.promises.readdir(chatsDir);
      const chatFiles = files.filter(file => file.endsWith('.json'));

      if (chatFiles.length === 0) {
        setError('No saved conversations found in ./chats/ directory.');
        return;
      }

      // Load conversation metadata
      const conversationInfos = [];
      for (const file of chatFiles) {
        try {
          const filePath = path.join(chatsDir, file);
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const savedConv: SavedConversation = JSON.parse(content);
          
          const chatInfo = parseChatFilename(file);
          if (chatInfo) {
            conversationInfos.push({
              filename: file,
              displayName: savedConv.metadata.aiGeneratedName.replace(/_/g, ' '),
              timestamp: chatInfo.dateStr,
              messageCount: savedConv.metadata.messageCount,
              model: savedConv.model,
              days: chatInfo.days
            });
          }
        } catch (err) {
          console.warn(`Failed to parse conversation file ${file}:`, err);
        }
      }

      if (conversationInfos.length === 0) {
        setError('No valid conversation files found.');
        return;
      }

      // Sort by date (newest first)
      conversationInfos.sort((a, b) => a.days - b.days);
      
      setAvailableConversations(conversationInfos);
      setShowInlineConversationSelector(true);
      setConversationSelectedIndex(0);
      
    } catch (err) {
      setError(`Failed to load conversations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const loadConversation = async (filename: string) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join('./chats', filename);
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const savedConv: SavedConversation = JSON.parse(content);
      
      // Restore conversation state
      const restoredMessages = savedConv.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(restoredMessages);
      
      // Try to restore the model if it exists in available models
      const modelExists = config.models.find((m: Model) => m.id === savedConv.model);
      if (modelExists) {
        setCurrentModel(modelExists);
      } else {
        // Model not available, add warning but keep current model
        setError(`Original model '${savedConv.model}' not available. Using current model '${currentModel.name}'.`);
      }
      
      setShowConversationSelector(false);
      setShowInlineConversationSelector(false);
      setAvailableConversations([]);
      setConversationSelectedIndex(0);
      setSuccessMessage(`Loaded conversation: ${savedConv.metadata.aiGeneratedName.replace(/_/g, ' ')}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      setError(`Failed to load conversation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setShowConversationSelector(false);
      setShowInlineConversationSelector(false);
    }
  };

  const handleConversationCancel = () => {
    setShowConversationSelector(false);
    setShowInlineConversationSelector(false);
    setAvailableConversations([]);
    setConversationSelectedIndex(0);
  };

  const handleConversationNavigate = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      setConversationSelectedIndex(prev => 
        prev > 0 ? prev - 1 : availableConversations.length - 1
      );
    } else {
      setConversationSelectedIndex(prev => 
        prev < availableConversations.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handleConversationSelect = () => {
    const selectedConv = availableConversations[conversationSelectedIndex];
    if (selectedConv) {
      loadConversation(selectedConv.filename);
      setShowInlineConversationSelector(false);
      setAvailableConversations([]);
      setConversationSelectedIndex(0);
    }
  };

  if (showModelSelector) {
    return (
      <ModelSelector
        models={config.models}
        currentModel={currentModel}
        onSelect={handleModelSelect}
        onAddModel={handleAddModel}
        onCancel={() => setShowModelSelector(false)}
      />
    );
  }

  if (showConversationSelector) {
    return (
      <ConversationSelector
        conversations={availableConversations}
        onSelect={loadConversation}
        onCancel={handleConversationCancel}
      />
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <ConversationView 
        messages={messages} 
        isLoading={isLoading} 
        error={error}
        successMessage={successMessage}
      />
      
      {showCommandSelector && (
        <CommandSelector
          commands={filteredCommands}
          selectedIndex={commandSelectedIndex}
          input={input}
        />
      )}
      
      {showInlineConversationSelector && (
        <ConversationSelectorInline
          conversations={availableConversations}
          selectedIndex={conversationSelectedIndex}
        />
      )}
      
      <Box borderStyle="single" borderTop paddingX={1}>
        <CustomTextInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          placeholder="Type your message or /help for commands..."
          showCommandSelector={showCommandSelector}
          commandSelectedIndex={commandSelectedIndex}
          filteredCommands={filteredCommands}
          onCommandNavigate={handleCommandNavigate}
          onCommandSelect={handleCommandSelect}
          onCommandCancel={handleCommandCancel}
          showConversationSelector={showInlineConversationSelector}
          conversationSelectedIndex={conversationSelectedIndex}
          onConversationNavigate={handleConversationNavigate}
          onConversationSelect={handleConversationSelect}
          onConversationCancel={handleConversationCancel}
        />
      </Box>
      
      <StatusBar 
        currentModel={currentModel}
        messageCount={messages.filter(m => m.role !== 'system').length}
        isLoading={isLoading}
      />
    </Box>
  );
}