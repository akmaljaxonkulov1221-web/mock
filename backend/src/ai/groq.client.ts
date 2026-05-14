import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import { APIError } from 'openai';

const GROQ_BASE = 'https://api.groq.com/openai/v1';

/** .env da qo'shtirnoq yoki bo'shliq bilan berilgan kalitlarni tozalash */
function normalizeEnvSecret(raw: string | undefined): string {
  let v = (raw ?? '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/^\uFEFF/, '');
}

function normalizeSttModel(raw: string | undefined): string {
  const m = (raw ?? '').trim();
  if (m) return m;
  return 'whisper-large-v3-turbo';
}

function formatGroqError(err: unknown): string {
  if (err instanceof APIError) {
    const body = err.error ? JSON.stringify(err.error) : '';
    return `HTTP ${err.status ?? '?'} ${err.message}${body ? ` | ${body}` : ''}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

@Injectable()
export class GroqClientService {
  private readonly logger = new Logger(GroqClientService.name);
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    const key = normalizeEnvSecret(process.env.GROQ_API_KEY);
    if (!key) {
      throw new ServiceUnavailableException(
        'GROQ_API_KEY is not configured. Set it in backend/.env and restart the server.',
      );
    }
    if (!this.client) {
      this.client = new OpenAI({ apiKey: key, baseURL: GROQ_BASE });
      const looksGroq = key.startsWith('gsk_');
      this.logger.log(`Groq client initialized (key length=${key.length}, Groq prefix gsk_: ${looksGroq})`);
    }
    return this.client;
  }

  chatJson<T>(params: {
    system: string;
    user: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ parsed: T; usage: { input?: number; output?: number }; latencyMs: number; model: string }> {
    const model = params.model ?? process.env.GROQ_CHAT_MODEL ?? 'llama-3.3-70b-versatile';
    const started = Date.now();
    return this.getClient()
      .chat.completions.create({
        model: model.trim(),
        temperature: params.temperature ?? 0.35,
        max_tokens: params.maxTokens ?? 2048,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.user },
        ],
      })
      .then((res) => {
        const latencyMs = Date.now() - started;
        const text = res.choices[0]?.message?.content ?? '{}';
        let parsed: T;
        try {
          parsed = JSON.parse(text) as T;
        } catch (e) {
          this.logger.error(`Groq JSON parse failed: ${(e as Error).message}`);
          throw new ServiceUnavailableException('AI response was not valid JSON');
        }
        const usage = res.usage;
        return {
          parsed,
          usage: { input: usage?.prompt_tokens, output: usage?.completion_tokens },
          latencyMs,
          model: model.trim(),
        };
      })
      .catch((err) => {
        this.logger.error(`Groq chat error: ${formatGroqError(err)}`);
        throw new ServiceUnavailableException('AI service temporarily unavailable');
      });
  }

  async transcribeAudio(params: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }): Promise<{
    text: string;
    segments?: { start: number; end: number }[];
    model: string;
    latencyMs: number;
  }> {
    const model = normalizeSttModel(process.env.GROQ_STT_MODEL);
    const started = Date.now();
    const client = this.getClient();
    const file = await toFile(params.buffer, params.filename, { type: params.mimeType });

    try {
      const res = await client.audio.transcriptions.create({
        file,
        model,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });
      const latencyMs = Date.now() - started;
      const verbose = res as unknown as { text?: string; segments?: { start: number; end: number }[] };
      return {
        text: verbose.text ?? '',
        segments: verbose.segments,
        model,
        latencyMs,
      };
    } catch (e1) {
      this.logger.warn(`Groq STT verbose_json failed: ${formatGroqError(e1)}`);
      try {
        const file2 = await toFile(params.buffer, params.filename, { type: params.mimeType });
        const res = await client.audio.transcriptions.create({
          file: file2,
          model,
          response_format: 'json',
        });
        const latencyMs = Date.now() - started;
        const plain = res as unknown as { text?: string };
        return { text: plain.text ?? '', segments: undefined, model, latencyMs };
      } catch (e2) {
        this.logger.error(`Groq STT (fallback json) failed: ${formatGroqError(e2)}`);
        throw new ServiceUnavailableException(
          'Speech-to-text service temporarily unavailable. Check GROQ_API_KEY in backend/.env, GROQ_STT_MODEL (e.g. whisper-large-v3-turbo), and backend terminal logs for HTTP status from Groq.',
        );
      }
    }
  }
}
