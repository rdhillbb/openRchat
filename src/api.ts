import axios, { AxiosInstance } from 'axios';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/openrouter-cli',
        'X-Title': 'OpenRouter CLI',
      },
      timeout: 60000,
    });
  }

  async sendMessage(
    model: string,
    messages: Message[]
  ): Promise<string> {
    try {
      const response = await this.client.post<ChatResponse>('/chat/completions', {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      });

      const choice = response.data.choices[0];
      if (!choice || !choice.message) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      return choice.message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your OPENROUTER_API_KEY.');
        } else if (error.response?.status === 404) {
          throw new Error(`Model "${model}" not found. Please check the model ID.`);
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please wait and try again.');
        } else if (error.response?.data?.error) {
          throw new Error(`API Error: ${error.response.data.error.message}`);
        }
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/models');
      return true;
    } catch (error) {
      return false;
    }
  }
}