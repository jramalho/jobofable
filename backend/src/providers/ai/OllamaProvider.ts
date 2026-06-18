import {
  AIProvider,
  GenerateJsonInput,
  GenerateTextInput,
  GenerateTextOutput,
} from './AIProvider';
import { AIProviderError } from '../../utils/errors';
import { parseJsonFromLLM } from '../../utils/jsonParser';

interface OllamaConfig {
  baseUrl: string;
  model: string;
}

interface OllamaChatResponse {
  message?: { content?: string };
}

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';

  constructor(private readonly config: OllamaConfig) {
    if (!config.baseUrl || !config.model) {
      throw new AIProviderError(
        'Ollama is not configured. Set OLLAMA_BASE_URL and OLLAMA_MODEL in the backend .env file.',
      );
    }
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const text = await this.chat(input, false);
    return { text, model: this.config.model, provider: this.name };
  }

  async generateJson<T>(input: GenerateJsonInput): Promise<T> {
    const prompt = input.schemaHint
      ? `${input.prompt}\n\nReturn ONLY a valid JSON object matching this shape, with no extra commentary:\n${input.schemaHint}`
      : `${input.prompt}\n\nReturn ONLY a valid JSON object, with no extra commentary.`;

    // LLMs occasionally emit malformed/truncated JSON; one retry fixes most cases.
    try {
      const text = await this.chat({ ...input, prompt }, true);
      return parseJsonFromLLM<T>(text);
    } catch (error) {
      console.warn(`[ollama] invalid JSON response, retrying once: ${String(error)}`);
      const text = await this.chat({ ...input, prompt }, true);
      return parseJsonFromLLM<T>(text);
    }
  }

  private async chat(input: GenerateTextInput, jsonMode: boolean): Promise<string> {
    const messages = [
      ...(input.systemPrompt ? [{ role: 'system', content: input.systemPrompt }] : []),
      { role: 'user', content: input.prompt },
    ];

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: false,
          ...(jsonMode ? { format: 'json' } : {}),
          options: {
            temperature: input.temperature ?? 0.4,
            num_predict: input.maxTokens ?? 4096,
          },
        }),
      });
    } catch (error) {
      throw new AIProviderError(
        `Could not reach Ollama at ${this.config.baseUrl}. Is Ollama running? (try: ollama serve)`,
        { cause: String(error) },
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new AIProviderError(
        `Ollama request failed with status ${response.status}. Check that model "${this.config.model}" is pulled (ollama pull ${this.config.model}).`,
        { status: response.status, body: body.slice(0, 500) },
      );
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data.message?.content;
    if (!content) {
      throw new AIProviderError('Ollama returned an empty response.');
    }
    return content;
  }
}
