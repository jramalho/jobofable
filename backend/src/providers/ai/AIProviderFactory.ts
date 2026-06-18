import { AIProvider, AIProviderName, AI_PROVIDER_NAMES } from './AIProvider';
import { GroqProvider } from './GroqProvider';
import { OllamaProvider } from './OllamaProvider';
import { ValidationError } from '../../utils/errors';

/**
 * Creates AI providers from environment configuration.
 * The rest of the app only ever sees the AIProvider interface.
 */
export class AIProviderFactory {
  static create(requestedProvider?: string): AIProvider {
    const name = this.resolveName(requestedProvider);

    switch (name) {
      case 'groq':
        return new GroqProvider({
          apiKey: process.env.GROQ_API_KEY ?? '',
          model: process.env.GROQ_MODEL ?? 'llama-3.1-70b-versatile',
          baseUrl: process.env.GROQ_BASE_URL,
        });
      case 'ollama':
        return new OllamaProvider({
          baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
          model: process.env.OLLAMA_MODEL ?? 'qwen2.5:14b',
        });
    }
  }

  private static resolveName(requestedProvider?: string): AIProviderName {
    const candidate = (requestedProvider ?? process.env.AI_PROVIDER ?? 'groq').toLowerCase();
    if (!AI_PROVIDER_NAMES.includes(candidate as AIProviderName)) {
      throw new ValidationError(
        `Unknown AI provider "${candidate}". Supported providers: ${AI_PROVIDER_NAMES.join(', ')}.`,
      );
    }
    return candidate as AIProviderName;
  }
}
