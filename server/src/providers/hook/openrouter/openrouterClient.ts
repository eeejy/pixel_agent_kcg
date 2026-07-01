import {
  OPENROUTER_API_URL,
  OPENROUTER_DEFAULT_MODEL,
} from './constants.js';

export type OpenRouterRole = 'system' | 'user' | 'assistant';

export interface OpenRouterMessage {
  role: OpenRouterRole;
  content: string;
}

export interface OpenRouterOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  appTitle?: string;
  siteUrl?: string;
  sessionId?: string;
}

export interface OpenRouterChatResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  raw: unknown;
}

interface OpenRouterErrorBody {
  error?: {
    message?: string;
    code?: string | number;
    type?: string;
  };
  message?: string;
}

interface OpenRouterChatResponse {
  model?: string;
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
}

export class OpenRouterClient {
  private readonly apiKey: string;
  readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly appTitle: string;
  private readonly siteUrl?: string;
  private readonly sessionId?: string;

  constructor(options: OpenRouterOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY ?? '';
    this.model = options.model ?? process.env.OPENROUTER_MODEL ?? OPENROUTER_DEFAULT_MODEL;
    this.temperature = options.temperature ?? numberFromEnv('OPENROUTER_TEMPERATURE', 0.4);
    this.maxTokens = options.maxTokens ?? integerFromEnv('OPENROUTER_MAX_TOKENS', 1024);
    this.appTitle = options.appTitle ?? 'Pixel Agents';
    this.siteUrl = options.siteUrl ?? process.env.OPENROUTER_SITE_URL;
    this.sessionId = options.sessionId;

    if (!this.apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY is not set. Set it in .env or your shell before launching Pixel Agents.',
      );
    }
  }

  async chat(messages: OpenRouterMessage[]): Promise<OpenRouterChatResult> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.siteUrl ?? 'https://github.com/pixel-agents-hq/pixel-agents',
      'X-Title': this.appTitle,
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: false,
        session_id: this.sessionId,
      }),
    });

    const text = await response.text();
    const parsed = parseJson(text);

    if (!response.ok) {
      throw new Error(formatOpenRouterError(response.status, parsed, text));
    }

    const data = parsed as OpenRouterChatResponse | null;
    const content = extractAssistantContent(data);
    if (!content) {
      throw new Error('OpenRouter returned no assistant message content.');
    }

    const usage = data?.usage;
    return {
      content,
      model: data?.model ?? this.model,
      inputTokens: usage?.prompt_tokens ?? usage?.input_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? usage?.output_tokens ?? 0,
      raw: data,
    };
  }
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function integerFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

function parseJson(text: string): unknown | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function extractAssistantContent(data: OpenRouterChatResponse | null): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === 'text' || part.text ? (part.text ?? '') : ''))
      .join('')
      .trim();
  }
  return '';
}

function formatOpenRouterError(status: number, parsed: unknown, fallbackText: string): string {
  const body = parsed as OpenRouterErrorBody | null;
  const message = body?.error?.message ?? body?.message ?? fallbackText;
  const code = body?.error?.code ? ` (${body.error.code})` : '';
  const type = body?.error?.type ? ` ${body.error.type}` : '';
  return `OpenRouter request failed with HTTP ${status}${code}${type}: ${message}`;
}
