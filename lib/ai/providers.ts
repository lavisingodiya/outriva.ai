import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logger';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface GenerateContentParams {
  provider: AIProvider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

type ProviderGenerateParams = Omit<GenerateContentParams, 'provider'> & {
  maxTokens: number;
  temperature: number;
};

/**
 * Generates content using the specified AI provider
 */
export async function generateContent({
  provider,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  maxTokens = 2000,
  temperature = 0.7,
}: GenerateContentParams): Promise<string> {
  try {
    switch (provider) {
      case 'openai':
        return await generateWithOpenAI({
          apiKey,
          model,
          systemPrompt,
          userPrompt,
          maxTokens,
          temperature,
        });

      case 'anthropic':
        return await generateWithAnthropic({
          apiKey,
          model,
          systemPrompt,
          userPrompt,
          maxTokens,
          temperature,
        });

      case 'gemini':
        return await generateWithGemini({
          apiKey,
          model,
          systemPrompt,
          userPrompt,
          maxTokens,
          temperature,
        });

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    logger.error('AI generation error', error);
    throw error;
  }
}

async function generateWithOpenAI({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  temperature,
}: ProviderGenerateParams): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
  });

  return response.choices[0]?.message?.content || '';
}

async function generateWithAnthropic({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  temperature,
}: ProviderGenerateParams): Promise<string> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
}

async function generateWithGemini({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  temperature,
}: ProviderGenerateParams): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  });

  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const result = await geminiModel.generateContent(combinedPrompt);
  const response = await result.response;
  return response.text();
}

/**
 * Determines the AI provider from the model name
 */
export function getProviderFromModel(model: string): AIProvider {
  if (model.includes('gpt')) {
    return 'openai';
  } else if (model.includes('claude')) {
    return 'anthropic';
  } else if (model.includes('gemini')) {
    return 'gemini';
  }
  throw new Error(`Could not determine provider for model: ${model}`);
}
