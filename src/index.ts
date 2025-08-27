#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { ConfigLoader } from './config.js';
import { OpenRouterClient } from './api.js';
import ChatApp from './components/ChatApp.js';

async function main() {
  try {
    // Clear the screen on startup
    console.clear();
    
    // Load configuration
    const configLoader = new ConfigLoader();
    const config = await configLoader.loadConfig();
    
    // Initialize API client
    const apiClient = new OpenRouterClient(config.apiKey);
    
    // Test API connection
    const isConnected = await apiClient.testConnection();
    if (!isConnected) {
      console.error('Failed to connect to OpenRouter API. Please check your API key and internet connection.');
      process.exit(1);
    }
    
    // Render the app
    render(React.createElement(ChatApp, { apiClient, config }));
  } catch (error) {
    console.error('Failed to start OpenRouter CLI:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);
