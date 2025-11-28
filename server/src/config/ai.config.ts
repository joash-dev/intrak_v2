import dotenv from 'dotenv';

dotenv.config();

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  enabled: boolean;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
}

export const getAIConfig = (): AIConfig => {
  const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider;
  const enabled = process.env.AI_ENABLED === 'true' || process.env.AI_ENABLED === '1';
  
  let apiKey = '';
  if (provider === 'openai') {
    apiKey = process.env.OPENAI_API_KEY || '';
  } else if (provider === 'anthropic') {
    apiKey = process.env.ANTHROPIC_API_KEY || '';
  } else if (provider === 'gemini') {
    apiKey = process.env.GEMINI_API_KEY || '';
  }

  // Default model recommendations based on provider
  const defaultModel = provider === 'openai' 
    ? 'gpt-3.5-turbo'  // Best balance of cost, speed, and quality
    : provider === 'anthropic'
    ? 'claude-3-haiku-20240307'  // Fastest and most cost-effective Anthropic option
    : 'gemini-2.5-flash';  // Google's fast and cost-effective model (latest)

  return {
    provider,
    enabled,
    model: process.env.AI_MODEL || defaultModel,
    apiKey,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10), // Default 2000 for Gemini thinking tokens (2.5 Flash uses ~1000 thinking tokens)
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  };
};

