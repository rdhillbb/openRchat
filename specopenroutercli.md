# OpenRouter CLI - Goals and Functional Requirements

## 1. Core Goal

To provide a rich, terminal-based chat interface for interacting with various AI models available through the OpenRouter API, ensuring a fluid and responsive user experience.

## 2. User Interface (TUI)

- **Modern TUI:** The application must have a modern, flicker-free terminal user interface.
- **Conversation View:** A primary, scrollable window that displays the full conversation history (user prompts and assistant replies).
- **Input Box:** A dedicated input box for users to type and submit messages and commands.
- **Status Bar / Footer:** A persistent area that displays the currently active AI model and helpful key bindings or commands.

## 3. Configuration

- **API Key:** The `OPENROUTER_API_KEY` must be configurable via an environment variable. The application should provide a clear error and exit if the key is not set.
- **System Prompt:** The initial system prompt must be loaded from an external XML file (`system.xml`). The application should look for the prompt within a `<system>` tag.
- **Model List:** The list of available AI models must be loaded from an external XML file (`models.xml`).

## 4. Core Functionality

- **Conversation Context:** The application must maintain the full conversation history (context) and send it with each API request to ensure the AI model is aware of the preceding dialogue.
- **Asynchronous API Calls:** All network requests to the OpenRouter API must be non-blocking to ensure the UI remains responsive while waiting for a response.
- **Error Handling:** The application should gracefully handle and display errors from the API (e.g., invalid API key, model not found, network issues).

## 5. Application Commands

The application must support the following slash-commands entered into the input box:

- `/exit`: Immediately quits the application.
- `/reset`: Clears the current conversation history and re-initializes the session with the default system prompt.
- `/swmodel`: Opens a model selection screen, allowing the user to switch the active AI model for the session.
- `/save [filename]`: Saves the complete transcript of the current conversation to a text file. If `filename` is omitted, a default name including a timestamp should be generated.

## 6. Model Management

- **Model Switching:** The `/swmodel` command should present the user with a list of available models read from `models.xml`.
- **Persistent Model List:** The user must have an option within the model switching interface to add a new model by name.
- **Configuration Persistence:** Any new model added by the user must be saved back to the `models.xml` file to be available in future sessions.
