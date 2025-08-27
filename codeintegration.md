# Code Integration Guide

This document provides technical details for developers who want to integrate with or extend OpenRChat's underlying components.

## API Integration

### OpenRouter Client Architecture

```typescript
// Core API client structure
class OpenRouterClient {
  constructor(config: {
    apiKey: string;
    baseURL?: string;  // Default: https://openrouter.ai/api/v1
    timeout?: number;  // Default: 60000ms
  })
  
  async sendMessage(messages: Message[]): Promise<OpenRouterResponse>
}
```

### Code Integration Example

```javascript
// Example: Integrating with OpenRChat's underlying API client
import { OpenRouterClient } from './src/api.js';

const client = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'deepseek/deepseek-chat-v3.1'
});

const response = await client.sendMessage([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Explain async/await in JavaScript' }
]);

console.log(response.choices[0].message.content);
```

### Request/Response Format

**Request Structure:**
```json
{
  "model": "deepseek/deepseek-chat-v3.1",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant."
    },
    {
      "role": "user", 
      "content": "Hello, how are you?"
    }
  ],
  "stream": false
}
```

**Response Structure:**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 23,
    "completion_tokens": 17,
    "total_tokens": 40
  }
}
```

### Error Handling

The client handles common error scenarios:

```typescript
// Error types and handling
try {
  const response = await client.sendMessage(messages);
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid API key');
  } else if (error.status === 404) {
    console.error('Model not found');
  } else if (error.status === 429) {
    console.error('Rate limit exceeded');
  }
}
```

## Development

### Project Structure

```
openrouter/
├── src/
│   ├── index.ts              # Application entry point
│   ├── api.ts                # OpenRouter API client
│   ├── config.ts             # XML configuration loader
│   └── components/
│       ├── ChatApp.tsx       # Main chat interface
│       ├── ConversationView.tsx  # Message display
│       ├── ModelSelector.tsx # Model switching UI
│       └── StatusBar.tsx     # Status information
├── models.xml                # AI model configuration
├── system.xml                # System prompt configuration
├── package.json
├── tsconfig.json
└── README.md
```

### Development Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npx tsc --noEmit
```

### Architecture Overview

**Three-Layer Architecture:**

1. **Configuration Layer** (`config.ts`): XML-based configuration system
2. **API Layer** (`api.ts`): OpenRouter API client with axios  
3. **UI Layer** (`components/`): React/Ink TUI components

**Application Flow:**
```
index.ts → ConfigLoader → OpenRouterClient → ChatApp (Ink render)
```

### Key Technical Decisions

- **ES Modules**: Full ES module support with `.js` imports
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **React/Ink**: Leverages React patterns for terminal UI development
- **XML Configuration**: Human-readable configuration with fallback defaults
- **Axios HTTP Client**: Robust HTTP client with timeout and error handling

### Advanced Usage Patterns

```bash
# 1. Switch models for different tasks
You: /swmodel
[Select: anthropic/claude-opus-4.1]
You: Please review this code for security issues...

# 2. Reset conversation context
You: /reset
[Conversation cleared, fresh start]

# 3. Save important conversations
You: /save security-review-session-2024-01-15
Conversation saved successfully.

# 4. Exit cleanly
You: /exit
[Application closes gracefully]
```

## Contributing

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git fork <repository-url>
   git clone <your-fork-url>
   cd openrouter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Set up your development environment**
   ```bash
   export OPENROUTER_API_KEY="your_test_api_key"
   npm run dev
   ```

### Contribution Guidelines

#### Code Standards

- **TypeScript**: All code must be properly typed
- **ES Modules**: Use ES module imports with `.js` extensions
- **React Patterns**: Follow React best practices for component design
- **Error Handling**: Implement comprehensive error handling
- **No Comments**: Keep code self-documenting (per project standards)

#### Testing

```bash
# Run type checking
npx tsc --noEmit

# Test the build process
npm run build
npm start
```

#### Submission Process

1. **Ensure code quality**
   - TypeScript compilation passes without errors
   - Application builds and runs successfully
   - New features include appropriate error handling
   - XML configuration follows existing patterns

2. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Provide clear description of changes
   - Include usage examples for new features
   - Reference any related issues

#### Areas for Contribution

- **New Model Support**: Add support for additional OpenRouter models
- **UI Enhancements**: Improve the terminal interface experience
- **Configuration Options**: Extend XML configuration capabilities
- **Performance Optimization**: Improve response times and memory usage
- **Documentation**: Enhance code documentation and examples
- **Error Handling**: Improve error messages and recovery mechanisms

### Development Notes

- **Ink-Specific Patterns**: Use `useInput` hook for keyboard handling
- **State Management**: ChatApp holds all conversation state via React state
- **Module Resolution**: Uses "bundler" module resolution for Ink compatibility
- **Build Process**: TypeScript compilation to `dist/` directory