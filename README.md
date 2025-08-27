# OpenRChat

A powerful terminal-based chat interface for OpenRouter AI models built with React and Ink. OpenRChat provides a clean, interactive command-line experience for conversing with various AI models through the OpenRouter API.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Commands](#commands)
- [Contributing](#contributing)
- [License](#license)

## Overview

OpenRChat is a React-based Terminal User Interface (TUI) application that brings AI conversations directly to your command line. Built with Ink and TypeScript, it offers a seamless chat experience with multiple AI models available through OpenRouter's unified API.

### Primary Purpose

- **Terminal-First AI Interactions**: Chat with AI models without leaving your terminal environment
- **Multi-Model Support**: Switch between different AI models (GPT, Claude, DeepSeek, etc.) in real-time
- **Developer-Friendly**: XML-based configuration system and clean architecture for easy customization
- **Conversation Management**: Full conversation history with save/restore capabilities

## Features

### 🚀 Key Capabilities

- **Interactive Terminal UI**: Clean, responsive chat interface built with React/Ink
- **Real-Time Model Switching**: Switch between AI models mid-conversation with `/swmodel`
- **Smart Input Handling**: Automatic truncation display for long text (shows `[text #]` while preserving full content)
- **Conversation Persistence**: Save conversations with timestamps using `/save`
- **XML Configuration**: Easily manage models and system prompts through XML files
- **Full Message History**: Complete conversation context sent to AI models
- **Slash Commands**: Built-in commands for session management
- **Error Handling**: Robust API error handling with user-friendly messages

### 🎯 Unique Features

- **Long Text Placeholder System**: Cleanly handles large text inputs without cluttering the interface
- **Dynamic Model Addition**: Add new models through the UI that persist to configuration
- **Status Bar**: Always-visible current model and command information
- **Keyboard Navigation**: Arrow key navigation for model selection
- **Scrollable History**: Navigate through long conversations with smooth scrolling

## Installation

### Prerequisites

- **Node.js 18+** (specified in package.json engines)
- **OpenRouter API Key** (get one at [openrouter.ai](https://openrouter.ai))

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd openrouter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your OpenRouter API key**
   ```bash
   # Option 1: Export for current session
   export OPENROUTER_API_KEY="your_api_key_here"
   
   # Option 2: Add to your shell profile (.bashrc, .zshrc, etc.)
   echo 'export OPENROUTER_API_KEY="your_api_key_here"' >> ~/.zshrc
   source ~/.zshrc
   
   # Option 3: Create a .env file (if supported)
   echo "OPENROUTER_API_KEY=your_api_key_here" > .env
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Run OpenRChat**
   ```bash
   npm start
   ```

### Alternative: Development Mode

For development with hot reloading:

```bash
npm run dev
```

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `OPENROUTER_API_KEY` | ✅ | Your OpenRouter API key | None |

### XML Configuration Files

OpenRChat uses two XML configuration files in the root directory:

#### `models.xml` - Available AI Models

```xml
<?xml version="1.0" encoding="UTF-8"?>
<models>
  <model id="deepseek/deepseek-chat-v3.1" name="DeepSeek Chat v3.1" />
  <model id="openai/gpt-5-chat" name="GPT-5 Chat" />
  <model id="anthropic/claude-opus-4.1" name="Claude Opus 4.1" />
  <model id="x-ai/grok-4" name="Grok 4" />
</models>
```

#### `system.xml` - System Prompt Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
  <system>You are a helpful AI assistant. Please provide clear, concise, and accurate responses to user queries.</system>
</config>
```

### Configuration Management

- **Automatic Fallbacks**: Missing XML files won't crash the application
- **Runtime Updates**: New models added via UI are automatically saved to `models.xml`
- **Custom System Prompts**: Modify `system.xml` to change the default AI behavior

## Usage

### Basic Chat Interaction

1. **Start the application**
   ```bash
   npm start
   ```

2. **Begin chatting**
   ```
   OpenRChat v0.1.0 - Connected to OpenRouter
   Current Model: DeepSeek Chat v3.1
   
   You: Hello! Can you help me with Python?
   AI: Hello! I'd be happy to help you with Python. What specific Python topic or problem would you like assistance with?
   ```

3. **Use commands as needed**
   ```
   You: /swmodel
   [Model selector appears with arrow key navigation]
   
   You: /save my-python-conversation
   Conversation saved to: my-python-conversation.json
   ```

### Long Text Handling

OpenRChat automatically handles long text inputs:

```bash
# When pasting or typing long text (>200 chars or >2 lines)
You: [text 1]  # Shows placeholder in UI
AI: [Full original text is sent to AI model]
```

### Advanced Usage Patterns

- **Switch models mid-conversation**: Use `/swmodel` to select different AI models for different tasks
- **Reset conversation**: Use `/reset` to start fresh while keeping your session active
- **Save conversations**: Use `/save` to preserve important chat sessions with timestamps
- **Clean exit**: Use `/exit` to close the application gracefully


## Commands

### Available Slash Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/help` | Show help message with all commands | `/help` |
| `/swmodel` | Switch AI model | `/swmodel` (opens interactive selector) |
| `/save` | Save conversation with AI-generated filename | `/save` |
| `/listchats` | List all saved conversations with dates | `/listchats` |
| `/newchat` | Save current conversation and start fresh | `/newchat` |
| `/exit` | Exit the application | `/exit` |

### Model Selection Interface

```bash
You: /swmodel

┌─ Select Model ─────────────────────┐
│ ↑/↓: Navigate  Enter: Select  Esc: Cancel │
├────────────────────────────────────┤
│ > DeepSeek Chat v3.1               │
│   GLM 4.5V                         │
│   GPT-5 Chat                       │
│   Claude Opus 4.1                  │
│   Grok 4                          │
│                                    │
│ + Add new model                    │
└────────────────────────────────────┘
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

3. **Set up your development environment**
   ```bash
   export OPENROUTER_API_KEY="your_test_api_key"
   npm run dev
   ```

### How to Contribute

- **New Model Support**: Add support for additional OpenRouter models
- **UI Enhancements**: Improve the terminal interface experience  
- **Configuration Options**: Extend XML configuration capabilities
- **Performance Optimization**: Improve response times and memory usage
- **Documentation**: Enhance user documentation and examples
- **Error Handling**: Improve error messages and user experience

For technical details and code integration examples, see [codeintegration.md](./codeintegration.md).

## License

ISC License - See LICENSE file for details.

---

**OpenRChat v0.1.0** - Bringing AI conversations to your terminal.

For support or questions, please open an issue on the project repository.

For developers interested in code integration and technical details, see [codeintegration.md](./codeintegration.md).
