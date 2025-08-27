import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

export interface Model {
  id: string;
  name: string;
}

export interface Config {
  apiKey: string;
  systemPrompt: string;
  models: Model[];
}

export class ConfigLoader {
  private xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });

  async loadConfig(): Promise<Config> {
    const apiKey = this.loadApiKey();
    const systemPrompt = await this.loadSystemPrompt();
    const models = await this.loadModels();

    return {
      apiKey,
      systemPrompt,
      models,
    };
  }

  private loadApiKey(): string {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('Error: OPENROUTER_API_KEY environment variable is not set.');
      console.error('Please set your OpenRouter API key:');
      console.error('export OPENROUTER_API_KEY="your-api-key-here"');
      process.exit(1);
    }
    return apiKey;
  }

  private async loadSystemPrompt(): Promise<string> {
    try {
      const xmlContent = await fs.promises.readFile('system.xml', 'utf-8');
      const parsed = this.xmlParser.parse(xmlContent);
      return parsed.config?.system || 'You are a helpful AI assistant.';
    } catch (error) {
      console.warn('Warning: Could not load system.xml, using default system prompt.');
      return 'You are a helpful AI assistant.';
    }
  }

  private async loadModels(): Promise<Model[]> {
    try {
      const xmlContent = await fs.promises.readFile('models.xml', 'utf-8');
      const parsed = this.xmlParser.parse(xmlContent);
      const modelsData = parsed.models?.model;
      
      if (!modelsData) {
        return this.getDefaultModels();
      }

      // Handle both single model and array of models
      const models = Array.isArray(modelsData) ? modelsData : [modelsData];
      const parsedModels = models.map((model: any) => ({
        id: model['@_id'] || model.id,
        name: model['@_name'] || model.name,
      }));
      
      // Remove duplicates based on model ID
      const uniqueModels = parsedModels.filter((model, index, arr) => 
        arr.findIndex(m => m.id === model.id) === index
      );
      
      return uniqueModels;
    } catch (error) {
      console.warn('Warning: Could not load models.xml, using default models.');
      return this.getDefaultModels();
    }
  }

  private getDefaultModels(): Model[] {
    return [
      { id: 'openai/gpt-4', name: 'GPT-4' },
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
    ];
  }

  async saveModels(models: Model[]): Promise<void> {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<models>
${models.map(model => `  <model id="${model.id}" name="${model.name}" />`).join('\n')}
</models>`;

    await fs.promises.writeFile('models.xml', xmlContent, 'utf-8');
  }
}