import {
  AIProvider,
  GenerateJsonInput,
  GenerateTextInput,
  GenerateTextOutput,
} from './AIProvider';
import { AIProviderError } from '../../utils/errors';
import { parseJsonFromLLM } from '../../utils/jsonParser';

interface GroqConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface GroqChatResponse {
  choices?: { message?: { content?: string } }[];
}

export class GroqProvider implements AIProvider {
  readonly name = 'groq';
  private readonly baseUrl: string;

  constructor(private readonly config: GroqConfig) {
    if (!config.apiKey) {
      throw new AIProviderError(
        'Groq is not configured. Set GROQ_API_KEY in the backend .env file or switch AI_PROVIDER to ollama.',
      );
    }
    this.baseUrl = config.baseUrl ?? 'https://api.groq.com/openai/v1';
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
      console.warn(`[groq] invalid JSON response, retrying once: ${String(error)}`);
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
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: input.temperature ?? 0.4,
          max_tokens: input.maxTokens ?? 4096,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
    } catch (error) {
      throw new AIProviderError('Could not reach the Groq API. Check your network connection.', {
        cause: String(error),
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new AIProviderError(
        `Groq API request failed with status ${response.status}. Check GROQ_API_KEY and GROQ_MODEL.`,
        { status: response.status, body: body.slice(0, 500) },
      );
    }

    const data = (await response.json()) as GroqChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new AIProviderError('Groq returned an empty response.');
    }
    return content;
  }
}
