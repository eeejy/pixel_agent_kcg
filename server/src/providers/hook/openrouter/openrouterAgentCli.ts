#!/usr/bin/env node

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'node:readline/promises';

import { normalizeProjectPath } from '../../../../../core/src/normalizeProjectPath.js';
import { OpenRouterClient, type OpenRouterMessage } from './openrouterClient.js';

interface Args {
  sessionId: string;
  cwd: string;
}

const SYSTEM_PROMPT =
  'You are an AI coding agent running inside Pixel Agents. Be concise, practical, and explicit about file changes you recommend. You do not have local tool access in this OpenRouter provider; ask the user to apply commands when needed.';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  loadDotEnv(args.cwd);

  const transcriptPath = createTranscript(args.cwd, args.sessionId);
  appendJsonl(transcriptPath, {
    type: 'system',
    subtype: 'session_start',
    session_id: args.sessionId,
    cwd: args.cwd,
    provider: 'openrouter',
  });

  let client: OpenRouterClient;
  try {
    client = new OpenRouterClient({ sessionId: args.sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Pixel Agents] ${message}`);
    appendAssistantError(transcriptPath, message);
    process.exitCode = 1;
    return;
  }

  console.log(`Pixel Agents OpenRouter provider`);
  console.log(`Model: ${client.model}`);
  console.log(`Session: ${args.sessionId}`);
  console.log('Type a prompt and press Enter. Use Ctrl+C to exit.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages: OpenRouterMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

  try {
    while (true) {
      const prompt = (await rl.question('\nYou: ')).trim();
      if (!prompt) continue;

      messages.push({ role: 'user', content: prompt });
      appendJsonl(transcriptPath, {
        type: 'user',
        message: { role: 'user', content: prompt },
        content: prompt,
      });

      const started = Date.now();
      process.stdout.write('\nAgent: ');
      try {
        const response = await client.chat(messages);
        messages.push({ role: 'assistant', content: response.content });
        process.stdout.write(`${response.content}\n`);
        appendJsonl(transcriptPath, {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: response.content }],
            usage: {
              input_tokens: response.inputTokens,
              output_tokens: response.outputTokens,
            },
          },
          content: [{ type: 'text', text: response.content }],
          model: response.model,
        });
        appendTurnDuration(transcriptPath, started);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        process.stdout.write(`OpenRouter error: ${message}\n`);
        appendAssistantError(transcriptPath, message);
        appendTurnDuration(transcriptPath, started);
      }
    }
  } finally {
    rl.close();
  }
}

function parseArgs(argv: string[]): Args {
  let sessionId = '';
  let cwd = process.env.PIXEL_AGENTS_CWD || process.env.PWD || process.cwd();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--session-id' && argv[i + 1]) {
      sessionId = argv[++i];
    } else if (arg === '--cwd' && argv[i + 1]) {
      cwd = argv[++i];
    }
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  return { sessionId, cwd };
}

function createTranscript(cwd: string, sessionId: string): string {
  const dir = path.join(
    os.homedir(),
    '.pixel-agents',
    'openrouter',
    'projects',
    normalizeProjectPath(cwd),
  );
  fs.mkdirSync(dir, { recursive: true });
  const transcriptPath = path.join(dir, `${sessionId}.jsonl`);
  fs.closeSync(fs.openSync(transcriptPath, 'a'));
  return transcriptPath;
}

function appendJsonl(filePath: string, value: Record<string, unknown>): void {
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, 'utf-8');
}

function appendAssistantError(filePath: string, message: string): void {
  appendJsonl(filePath, {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text: `OpenRouter error: ${message}` }],
    },
    content: [{ type: 'text', text: `OpenRouter error: ${message}` }],
  });
}

function appendTurnDuration(filePath: string, started: number): void {
  appendJsonl(filePath, {
    type: 'system',
    subtype: 'turn_duration',
    duration_ms: Date.now() - started,
  });
}

function loadDotEnv(cwd: string): void {
  for (const envPath of candidateEnvFiles(cwd)) {
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = unquoteEnvValue(rawValue.trim());
    }
  }
}

function candidateEnvFiles(cwd: string): string[] {
  return [path.join(cwd, '.env'), path.join(process.cwd(), '.env')];
}

function unquoteEnvValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
