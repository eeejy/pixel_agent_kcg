/**
 * Provider registry: re-exports all bundled providers.
 *
 * Adding a new provider:
 *   1. Create `server/src/providers/hook/<provider>/<provider>.ts`
 *      implementing HookProvider.
 *   2. Add an export line below.
 *
 * The adapter (VS Code extension, standalone CLI, etc.) imports from here rather
 * than reaching into each provider directory directly.
 */

export { openrouterProvider } from './hook/openrouter/openrouter.js';
