import * as os from 'os';
import * as path from 'path';

import { normalizeProjectPath } from '../../../../../core/src/normalizeProjectPath.js';
import type { AgentEvent, HookProvider } from '../../../../../core/src/provider.js';
import {
  BASH_COMMAND_DISPLAY_MAX_LENGTH,
  TASK_DESCRIPTION_DISPLAY_MAX_LENGTH,
} from '../../../constants.js';
import {
  OPENROUTER_DISPLAY_NAME,
  OPENROUTER_PROVIDER_ID,
  OPENROUTER_TERMINAL_NAME_PREFIX,
} from './constants.js';

export function formatToolStatus(toolName: string, input?: unknown): string {
  const inp = (input ?? {}) as Record<string, unknown>;
  const base = (p: unknown) => (typeof p === 'string' ? path.basename(p) : '');
  switch (toolName) {
    case 'Read':
      return `Reading ${base(inp.file_path)}`;
    case 'Edit':
      return `Editing ${base(inp.file_path)}`;
    case 'Write':
      return `Writing ${base(inp.file_path)}`;
    case 'Bash': {
      const cmd = (inp.command as string) || '';
      return `Running: ${cmd.length > BASH_COMMAND_DISPLAY_MAX_LENGTH ? `${cmd.slice(0, BASH_COMMAND_DISPLAY_MAX_LENGTH)}...` : cmd}`;
    }
    case 'Glob':
      return 'Searching files';
    case 'Grep':
      return 'Searching code';
    case 'WebFetch':
      return 'Fetching web content';
    case 'WebSearch':
      return 'Searching the web';
    case 'Task':
    case 'Agent': {
      const desc = typeof inp.description === 'string' ? inp.description : '';
      return desc
        ? `Subtask: ${desc.length > TASK_DESCRIPTION_DISPLAY_MAX_LENGTH ? `${desc.slice(0, TASK_DESCRIPTION_DISPLAY_MAX_LENGTH)}...` : desc}`
        : 'Running subtask';
    }
    default:
      return `Using ${toolName}`;
  }
}

function getSessionDirs(workspacePath: string): string[] {
  return [
    path.join(
      os.homedir(),
      '.pixel-agents',
      'openrouter',
      'projects',
      normalizeProjectPath(workspacePath),
    ),
  ];
}

function getAllSessionRoots(): string[] {
  return [path.join(os.homedir(), '.pixel-agents', 'openrouter', 'projects')];
}

function buildLaunchCommand(
  sessionId: string,
  cwd: string,
): { command: string; args: string[]; env?: Record<string, string> } {
  return {
    command: process.execPath,
    args: [path.join(__dirname, 'openrouter-agent.js'), '--session-id', sessionId, '--cwd', cwd],
    env: { PWD: cwd, PIXEL_AGENTS_CWD: cwd },
  };
}

function normalizeHookEvent(raw: Record<string, unknown>): { sessionId: string; event: AgentEvent } | null {
  const eventName = raw.hook_event_name;
  const sessionId = raw.session_id;
  if (typeof eventName !== 'string' || typeof sessionId !== 'string') return null;

  if (eventName === 'Stop') {
    return { sessionId, event: { kind: 'turnEnd' } };
  }

  return null;
}

function noop(): Promise<void> {
  return Promise.resolve();
}

function hooksNotInstalled(): Promise<boolean> {
  return Promise.resolve(false);
}

export const openrouterProvider: HookProvider = {
  kind: 'hook',
  id: OPENROUTER_PROVIDER_ID,
  displayName: OPENROUTER_DISPLAY_NAME,
  protocolVersion: 1,

  normalizeHookEvent,
  installHooks: noop,
  uninstallHooks: noop,
  areHooksInstalled: hooksNotInstalled,

  formatToolStatus,
  permissionExemptTools: new Set(['Task', 'Agent', 'AskUserQuestion']),
  subagentToolNames: new Set(['Task', 'Agent']),
  readingTools: new Set(['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch']),
  terminalNamePrefix: OPENROUTER_TERMINAL_NAME_PREFIX,

  getSessionDirs,
  getAllSessionRoots,
  sessionFilePattern: '*.jsonl',
  buildLaunchCommand,
};
