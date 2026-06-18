export interface GenerateTextInput {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateTextOutput {
  text: string;
  model: string;
  provider: string;
}

export interface GenerateJsonInput extends GenerateTextInput {
  /** Human-readable description of the expected JSON shape, appended to the prompt. */
  schemaHint?: string;
}

export interface AIProvider {
  readonly name: string;
  generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
  generateJson<T>(input: GenerateJsonInput): Promise<T>;
}

export type AIProviderName = 'groq' | 'ollama';

export const AI_PROVIDER_NAMES: AIProviderName[] = ['groq', 'ollama'];
