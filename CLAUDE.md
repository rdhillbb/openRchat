# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Run
```bash
npm run build        # Compile TypeScript to dist/
npm start           # Run the built CLI application
npm run dev         # Run directly from TypeScript source (development)
```

### Prerequisites
- Set `OPENROUTER_API_KEY` environment variable before running
- Node.js 18+ required (specified in package.json engines)

## Architecture Overview

This is a **React-based Terminal User Interface (TUI)** application built with **Ink** that provides a chat interface for OpenRouter AI models.

### Core Architecture Pattern

**Three-Layer Architecture:**
1. **Configuration Layer** (`config.ts`): XML-based configuration system
2. **API Layer** (`api.ts`): OpenRouter API client with axios
3. **UI Layer** (`components/`): React/Ink TUI components

### Application Flow
```
index.ts → ConfigLoader → OpenRouterClient → ChatApp (Ink render)
```

The application follows this startup sequence:
1. Load configuration from XML files and environment variables
2. Initialize OpenRouter API client and test connection
3. Render the React TUI using Ink

### Key Components

**ChatApp.tsx** - Main application component managing:
- Conversation state with full message history
- Input handling with long-text placeholder system (displays `[text #]` for long input)
- Slash command routing (`/exit`, `/reset`, `/swmodel`, `/save`)
- Model switching and management

**ConversationView.tsx** - Message display component:
- Scrollable conversation history
- Timestamps and role-based styling
- Always displays full content (no truncation)

**ModelSelector.tsx** - Model switching interface:
- Uses Ink's `useInput` hook for keyboard navigation
- Supports adding new models that persist to XML
- Arrow key navigation with Enter/Escape controls

**StatusBar.tsx** - Bottom status display showing current model and available commands

## XML Configuration System

### Two Configuration Files (Root Level)

**models.xml** - Defines available AI models:
```xml
<models>
  <model id="deepseek/deepseek-chat-v3.1" name="DeepSeek Chat v3.1" />
  <!-- ... more models -->
</models>
```

**system.xml** - Contains the system prompt:
```xml
<config>
  <system>Your system prompt here</system>
</config>
```

### Configuration Loading Pattern
- Uses `fast-xml-parser` with `ignoreAttributes: false` and `attributeNamePrefix: '@_'`
- Falls back to defaults if XML files are missing/corrupt
- New models added via UI are automatically saved back to `models.xml`

## API Integration

### OpenRouter Client Architecture
- **Base URL**: `https://openrouter.ai/api/v1`
- **Authentication**: Bearer token from `OPENROUTER_API_KEY`
- **Headers**: Includes referer and title for OpenRouter analytics
- **Timeout**: 60 seconds for API calls
- **Error Handling**: Specific handling for 401 (auth), 404 (model), 429 (rate limit)

### Message Flow
1. User input → ChatApp state
2. Full conversation history sent to API (including system prompt)
3. Response → conversation state → UI update

## Input Text Handling System

### Long Text Placeholder Feature
- **Trigger**: Text with >2 lines OR >200 characters
- **Display**: Shows `[text #]` in input field while typing/pasting
- **Storage**: Full original text stored in `actualInput` state
- **API**: Always sends complete original text, never the placeholder
- **Conversation**: Always displays full text in chat history

This allows clean UI for long pastes while preserving full content for AI processing.

## TypeScript Configuration

### Key Settings
- **Target**: ES2022 with ESNext modules
- **Module Resolution**: "bundler" (required for Ink compatibility)
- **JSX**: "react" for Ink components
- **Strict Mode**: Enabled with all strict checks

### Import Strategy
- Uses `.js` extensions in import statements (TypeScript requirement for ESNext)
- ES modules throughout (package.json has `"type": "module"`)

## Development Notes

### Ink-Specific Patterns
- Components use `useInput` hook for keyboard handling (not raw stdin events)
- `render()` call in index.ts starts the TUI
- Box/Text components for layout (similar to React Native)
- Input handling requires `isActive` prop for focus management

### State Management Pattern
- ChatApp holds all conversation state
- Props drilling for API client and config
- No external state management (Redux/Context) - React state only

### Error Handling Strategy
- Configuration errors exit process immediately
- API errors display in UI but don't crash app
- Graceful fallbacks for missing XML files