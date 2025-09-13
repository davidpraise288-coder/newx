import {
  Plugin,
  IAgentRuntime,
} from '@elizaos/core';

// Import all plugin components
import { openChatActions } from './actions/index.js';
import { openChatEvaluators } from './evaluators/index.js';
import { openChatProviders } from './providers/index.js';

// Import types and utilities
import { OpenChatConfig } from './types/openchat.types.js';
import { OpenChatMessageHandler } from './utils/message-handler.js';
import { OpenChatAuth } from './utils/auth.js';

/**
 * OpenChat Plugin for ElizaOS
 * 
 * Enables agents to interact with OpenChat - a decentralized messaging platform
 * built on the Internet Computer blockchain.
 * 
 * Features:
 * - Send and receive direct messages
 * - Join and participate in group chats
 * - Interact with communities
 * - Handle crypto transactions (if enabled)
 * - Real-time message polling
 * - Identity management
 * 
 * @example
 * ```typescript
 * import { openChatPlugin } from '@elizaos/plugin-openchat';
 * 
 * const runtime = new AgentRuntime({
 *   plugins: [openChatPlugin],
 *   settings: {
 *     OPENCHAT_CONFIG: {
 *       canisterId: 'your-openchat-canister-id',
 *       host: 'https://ic0.app',
 *       polling: { enabled: true, interval: 5000 },
 *       features: {
 *         enableDirectMessages: true,
 *         enableGroupChats: true,
 *         enableCommunities: false,
 *       }
 *     }
 *   }
 * });
 * ```
 */
export const openChatPlugin: Plugin = {
  name: 'openchat',
  description: 'OpenChat integration plugin for Internet Computer messaging',
  actions: openChatActions,
  evaluators: openChatEvaluators,
  providers: openChatProviders,
  services: [],
};

/**
 * OpenChat Client Service
 * 
 * Provides a service wrapper for OpenChat functionality that can be
 * used independently of the full plugin.
 */
export class OpenChatService {
  private messageHandler: OpenChatMessageHandler | null = null;
  private auth: OpenChatAuth | null = null;
  private config: OpenChatConfig;
  private isInitialized = false;

  constructor(config: OpenChatConfig) {
    this.config = config;
  }

  /**
   * Initialize the OpenChat service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing OpenChat service...');

    // Initialize authentication
    this.auth = new OpenChatAuth({
      identityPath: this.config.identity,
      useInternetIdentity: false, // Service mode
    });
    
    await this.auth.initialize();

    // Initialize message handler
    this.messageHandler = new OpenChatMessageHandler({
      config: this.config,
      onMessage: async (messageWrapper) => {
        console.log('Received OpenChat message:', messageWrapper);
        // Emit event or handle message
      },
      onError: (error) => {
        console.error('OpenChat error:', error);
        // Handle error
      },
    });

    await this.messageHandler.initialize();

    this.isInitialized = true;
    console.log('OpenChat service initialized successfully');
  }

  /**
   * Send a message
   */
  async sendMessage(recipient: string, message: string): Promise<void> {
    if (!this.messageHandler) {
      throw new Error('OpenChat service not initialized');
    }

    const { OpenChatUtils } = await import('./utils/ic-client.js');
    const recipientPrincipal = OpenChatUtils.createPrincipal(recipient);
    
    await this.messageHandler.sendMessage(recipientPrincipal, message);
  }

  /**
   * Join a group
   */
  async joinGroup(groupId: string, inviteCode?: string): Promise<void> {
    if (!this.messageHandler) {
      throw new Error('OpenChat service not initialized');
    }

    const { OpenChatUtils } = await import('./utils/ic-client.js');
    const groupPrincipal = OpenChatUtils.createPrincipal(groupId);
    const code = inviteCode ? BigInt(inviteCode) : undefined;
    
    await this.messageHandler.joinGroup(groupPrincipal, code);
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string): Promise<void> {
    if (!this.messageHandler) {
      throw new Error('OpenChat service not initialized');
    }

    const { OpenChatUtils } = await import('./utils/ic-client.js');
    const groupPrincipal = OpenChatUtils.createPrincipal(groupId);
    
    await this.messageHandler.leaveGroup(groupPrincipal);
  }

  /**
   * Get current user principal
   */
  getCurrentUser(): string {
    if (!this.messageHandler) {
      throw new Error('OpenChat service not initialized');
    }

    return this.messageHandler.getCurrentUser().toString();
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.messageHandler?.isReady() === true;
  }

  /**
   * Clean up service
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up OpenChat service...');
    
    if (this.messageHandler) {
      await this.messageHandler.cleanup();
      this.messageHandler = null;
    }

    if (this.auth) {
      await this.auth.cleanup();
      this.auth = null;
    }

    this.isInitialized = false;
    console.log('OpenChat service cleanup complete');
  }
}

/**
 * Utility function to create OpenChat configuration
 */
export function createOpenChatConfig(options: {
  canisterId: string;
  host?: string;
  identity?: string;
  enablePolling?: boolean;
  pollingInterval?: number;
  features?: {
    enableDirectMessages?: boolean;
    enableGroupChats?: boolean;
    enableCommunities?: boolean;
    enableCrypto?: boolean;
    enablePolls?: boolean;
    enableMedia?: boolean;
  };
}): OpenChatConfig {
  return {
    canisterId: options.canisterId,
    host: options.host || 'https://ic0.app',
    identity: options.identity,
    agentOptions: {
      retryTimes: 3,
      retryDelay: 1000,
    },
    polling: {
      enabled: options.enablePolling !== false,
      interval: options.pollingInterval || 5000,
    },
    features: {
      enableDirectMessages: options.features?.enableDirectMessages !== false,
      enableGroupChats: options.features?.enableGroupChats !== false,
      enableCommunities: options.features?.enableCommunities || false,
      enableCrypto: options.features?.enableCrypto || false,
      enablePolls: options.features?.enablePolls !== false,
      enableMedia: options.features?.enableMedia !== false,
    },
  };
}

/**
 * Utility function to validate OpenChat configuration
 */
export function validateOpenChatConfig(config: OpenChatConfig): string[] {
  const errors: string[] = [];

  if (!config.canisterId) {
    errors.push('canisterId is required');
  }

  if (config.canisterId && !config.canisterId.includes('-')) {
    errors.push('canisterId must be a valid Principal ID');
  }

  if (config.host && !config.host.startsWith('http')) {
    errors.push('host must be a valid URL');
  }

  if (config.polling?.interval && config.polling.interval < 1000) {
    errors.push('polling interval must be at least 1000ms');
  }

  if (config.agentOptions?.retryTimes && config.agentOptions.retryTimes < 0) {
    errors.push('retryTimes must be non-negative');
  }

  if (config.agentOptions?.retryDelay && config.agentOptions.retryDelay < 0) {
    errors.push('retryDelay must be non-negative');
  }

  return errors;
}

// Re-export important types and utilities
export * from './types/openchat.types.js';
export * from './utils/ic-client.js';
export * from './utils/message-handler.js';
export * from './utils/auth.js';
export * from './actions/index.js';
export * from './evaluators/index.js';
export * from './providers/index.js';
export * from './config/openchat-canisters.js';

// Default export
export default openChatPlugin;

/**
 * Plugin initialization helper
 */
export async function initializeOpenChatPlugin(
  runtime: IAgentRuntime,
  config: OpenChatConfig
): Promise<void> {
  // Validate configuration
  const errors = validateOpenChatConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid OpenChat configuration: ${errors.join(', ')}`);
  }

  // Set configuration in runtime
  runtime.setSetting('OPENCHAT_CONFIG', config);

  // Initialize authentication if needed
  const auth = new OpenChatAuth({
    identityPath: config.identity,
    useInternetIdentity: false,
  });

  const identity = await auth.initialize();
  runtime.setSetting('OPENCHAT_AGENT_PRINCIPAL', identity.getPrincipal().toString());

  console.log('OpenChat plugin initialized successfully');
  console.log('Agent Principal:', identity.getPrincipal().toString());
}