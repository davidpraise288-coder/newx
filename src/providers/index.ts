// Export all OpenChat providers
export { openChatProvider, openChatMemoryProvider } from './openchat-provider.js';

// Re-export for convenience
export const openChatProviders = [
  openChatProvider,
  openChatMemoryProvider,
];

export default openChatProviders;