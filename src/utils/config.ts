import * as dotenv from 'dotenv';
import { OpenChatConfig } from '../types/openchat.types.js';

// Load environment variables
dotenv.config();

/**
 * Load OpenChat configuration from environment variables
 */
export function loadConfigFromEnv(): OpenChatConfig {
  const config: OpenChatConfig = {
    canisterId: process.env.OPENCHAT_CANISTER_ID || '',
    host: process.env.OPENCHAT_HOST || 'https://ic0.app',
    identity: process.env.OPENCHAT_IDENTITY_PATH,
    agentOptions: {
      retryTimes: parseInt(process.env.OPENCHAT_RETRY_TIMES || '3'),
      retryDelay: parseInt(process.env.OPENCHAT_RETRY_DELAY || '1000'),
    },
    polling: {
      enabled: process.env.OPENCHAT_POLLING_ENABLED !== 'false',
      interval: parseInt(process.env.OPENCHAT_POLLING_INTERVAL || '5000'),
    },
    features: {
      enableDirectMessages: process.env.OPENCHAT_ENABLE_DIRECT_MESSAGES !== 'false',
      enableGroupChats: process.env.OPENCHAT_ENABLE_GROUP_CHATS !== 'false',
      enableCommunities: process.env.OPENCHAT_ENABLE_COMMUNITIES === 'true',
      enableCrypto: process.env.OPENCHAT_ENABLE_CRYPTO === 'true',
      enablePolls: process.env.OPENCHAT_ENABLE_POLLS !== 'false',
      enableMedia: process.env.OPENCHAT_ENABLE_MEDIA !== 'false',
    },
  };

  // Validate required fields
  if (!config.canisterId) {
    throw new Error('OPENCHAT_CANISTER_ID environment variable is required');
  }

  return config;
}

/**
 * Configuration presets for different environments
 */
export const configPresets = {
  /**
   * Development configuration
   */
  development: (): OpenChatConfig => ({
    canisterId: 'rdmx6-jaaaa-aaaah-qacaa-cai', // Example canister ID
    host: 'http://127.0.0.1:8000', // Local replica
    identity: './dev-identity.json',
    agentOptions: {
      retryTimes: 1,
      retryDelay: 500,
    },
    polling: {
      enabled: true,
      interval: 2000, // Faster polling for development
    },
    features: {
      enableDirectMessages: true,
      enableGroupChats: true,
      enableCommunities: false,
      enableCrypto: false,
      enablePolls: true,
      enableMedia: false, // Disable for faster testing
    },
  }),

  /**
   * Production configuration
   */
  production: (canisterId: string): OpenChatConfig => ({
    canisterId,
    host: 'https://ic0.app',
    identity: './prod-identity.json',
    agentOptions: {
      retryTimes: 5,
      retryDelay: 2000,
    },
    polling: {
      enabled: true,
      interval: 10000, // Slower polling for production
    },
    features: {
      enableDirectMessages: true,
      enableGroupChats: true,
      enableCommunities: true,
      enableCrypto: true,
      enablePolls: true,
      enableMedia: true,
    },
  }),

  /**
   * Testing configuration
   */
  testing: (): OpenChatConfig => ({
    canisterId: 'test-canister-id',
    host: 'http://localhost:8000',
    identity: './test-identity.json',
    agentOptions: {
      retryTimes: 1,
      retryDelay: 100,
    },
    polling: {
      enabled: false, // No polling in tests
      interval: 1000,
    },
    features: {
      enableDirectMessages: true,
      enableGroupChats: false,
      enableCommunities: false,
      enableCrypto: false,
      enablePolls: false,
      enableMedia: false,
    },
  }),

  /**
   * Minimal configuration for basic messaging only
   */
  minimal: (canisterId: string): OpenChatConfig => ({
    canisterId,
    host: 'https://ic0.app',
    agentOptions: {
      retryTimes: 3,
      retryDelay: 1000,
    },
    polling: {
      enabled: true,
      interval: 5000,
    },
    features: {
      enableDirectMessages: true,
      enableGroupChats: false,
      enableCommunities: false,
      enableCrypto: false,
      enablePolls: false,
      enableMedia: false,
    },
  }),
};

/**
 * Get configuration based on environment
 */
export function getConfigForEnvironment(env?: string): OpenChatConfig {
  const environment = env || process.env.NODE_ENV || 'development';

  switch (environment) {
    case 'development':
    case 'dev':
      return configPresets.development();
    
    case 'production':
    case 'prod':
      const prodCanisterId = process.env.OPENCHAT_CANISTER_ID;
      if (!prodCanisterId) {
        throw new Error('OPENCHAT_CANISTER_ID is required for production environment');
      }
      return configPresets.production(prodCanisterId);
    
    case 'testing':
    case 'test':
      return configPresets.testing();
    
    default:
      console.warn(`Unknown environment '${environment}', using development config`);
      return configPresets.development();
  }
}

/**
 * Merge configuration with overrides
 */
export function mergeConfig(
  base: OpenChatConfig,
  overrides: Partial<OpenChatConfig>
): OpenChatConfig {
  return {
    ...base,
    ...overrides,
    agentOptions: {
      ...base.agentOptions,
      ...overrides.agentOptions,
    },
    polling: {
      ...base.polling,
      ...overrides.polling,
    },
    features: {
      ...base.features,
      ...overrides.features,
    },
  };
}

/**
 * Configuration validation utilities
 */
export class ConfigValidator {
  /**
   * Validate canister ID format
   */
  static isValidCanisterId(canisterId: string): boolean {
    // Basic validation for IC Principal format
    return /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/.test(canisterId);
  }

  /**
   * Validate host URL
   */
  static isValidHost(host: string): boolean {
    try {
      new URL(host);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate polling interval
   */
  static isValidPollingInterval(interval: number): boolean {
    return interval >= 1000 && interval <= 60000; // 1 second to 1 minute
  }

  /**
   * Validate retry configuration
   */
  static isValidRetryConfig(retryTimes: number, retryDelay: number): boolean {
    return retryTimes >= 0 && retryTimes <= 10 && retryDelay >= 0 && retryDelay <= 10000;
  }

  /**
   * Comprehensive configuration validation
   */
  static validateConfig(config: OpenChatConfig): string[] {
    const errors: string[] = [];

    if (!config.canisterId) {
      errors.push('canisterId is required');
    } else if (!this.isValidCanisterId(config.canisterId)) {
      errors.push('canisterId must be a valid IC Principal ID');
    }

    if (config.host && !this.isValidHost(config.host)) {
      errors.push('host must be a valid URL');
    }

    if (config.polling?.interval && !this.isValidPollingInterval(config.polling.interval)) {
      errors.push('polling interval must be between 1000 and 60000 milliseconds');
    }

    if (config.agentOptions?.retryTimes !== undefined && 
        config.agentOptions?.retryDelay !== undefined &&
        !this.isValidRetryConfig(config.agentOptions.retryTimes, config.agentOptions.retryDelay)) {
      errors.push('retry configuration is invalid');
    }

    return errors;
  }
}

/**
 * Configuration builder for fluent API
 */
export class ConfigBuilder {
  private config: Partial<OpenChatConfig> = {};

  canister(canisterId: string): this {
    this.config.canisterId = canisterId;
    return this;
  }

  host(host: string): this {
    this.config.host = host;
    return this;
  }

  identity(identityPath: string): this {
    this.config.identity = identityPath;
    return this;
  }

  polling(enabled: boolean, interval?: number): this {
    this.config.polling = {
      enabled,
      interval: interval || 5000,
    };
    return this;
  }

  retries(times: number, delay?: number): this {
    this.config.agentOptions = {
      retryTimes: times,
      retryDelay: delay || 1000,
    };
    return this;
  }

  enableFeature(feature: keyof NonNullable<OpenChatConfig['features']>, enabled: boolean): this {
    if (!this.config.features) {
      this.config.features = {};
    }
    this.config.features[feature] = enabled;
    return this;
  }

  build(): OpenChatConfig {
    const errors = ConfigValidator.validateConfig(this.config as OpenChatConfig);
    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }
    return this.config as OpenChatConfig;
  }
}

/**
 * Create a configuration builder
 */
export function createConfig(): ConfigBuilder {
  return new ConfigBuilder();
}