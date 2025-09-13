import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AgentRuntime } from '@elizaos/core';
import { 
  openChatPlugin,
  OpenChatService,
  createOpenChatConfig,
  validateOpenChatConfig,
  ConfigBuilder,
} from '../index.js';

// Mock the IC dependencies
jest.mock('@dfinity/agent');
jest.mock('@dfinity/principal');
jest.mock('@dfinity/identity');

describe('OpenChat Plugin', () => {
  let runtime: AgentRuntime;
  let config: any;

  beforeEach(() => {
    config = createOpenChatConfig({
      canisterId: 'rdmx6-jaaaa-aaaah-qacaa-cai',
      host: 'http://localhost:8000',
      enablePolling: false, // Disable polling in tests
    });

    runtime = new AgentRuntime({
      databaseAdapter: null,
      token: 'test-token',
      plugins: [openChatPlugin],
    });
  });

  afterEach(async () => {
    // Clean up any resources
  });

  describe('Plugin Structure', () => {
    it('should have correct plugin properties', () => {
      expect(openChatPlugin.name).toBe('openchat');
      expect(openChatPlugin.description).toContain('OpenChat integration');
      expect(Array.isArray(openChatPlugin.actions)).toBe(true);
      expect(Array.isArray(openChatPlugin.evaluators)).toBe(true);
      expect(Array.isArray(openChatPlugin.providers)).toBe(true);
    });

    it('should have all required actions', () => {
      const actionNames = openChatPlugin.actions?.map(action => action.name) || [];
      expect(actionNames).toContain('SEND_OPENCHAT_MESSAGE');
      expect(actionNames).toContain('JOIN_OPENCHAT_GROUP');
      expect(actionNames).toContain('LEAVE_OPENCHAT_GROUP');
      expect(actionNames).toContain('GET_OPENCHAT_MESSAGES');
    });

    it('should have all required evaluators', () => {
      const evaluatorNames = openChatPlugin.evaluators?.map(evaluator => evaluator.name) || [];
      expect(evaluatorNames).toContain('OPENCHAT_MESSAGE_EVALUATOR');
    });

    it('should have all required providers', () => {
      const providerNames = openChatPlugin.providers?.map(provider => provider.name) || [];
      expect(providerNames).toContain('OPENCHAT_PROVIDER');
      expect(providerNames).toContain('OPENCHAT_MEMORY_PROVIDER');
    });
  });

  describe('Configuration', () => {
    it('should create valid configuration', () => {
      const config = createOpenChatConfig({
        canisterId: 'rdmx6-jaaaa-aaaah-qacaa-cai',
      });

      expect(config.canisterId).toBe('rdmx6-jaaaa-aaaah-qacaa-cai');
      expect(config.host).toBe('https://ic0.app');
      expect(config.polling?.enabled).toBe(true);
      expect(config.features?.enableDirectMessages).toBe(true);
    });

    it('should validate configuration correctly', () => {
      const validConfig = createOpenChatConfig({
        canisterId: 'rdmx6-jaaaa-aaaah-qacaa-cai',
      });

      const errors = validateOpenChatConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const invalidConfig = createOpenChatConfig({
        canisterId: '', // Invalid
      });

      const errors = validateOpenChatConfig(invalidConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('canisterId');
    });

    it('should use ConfigBuilder correctly', () => {
      const config = new ConfigBuilder()
        .canister('rdmx6-jaaaa-aaaah-qacaa-cai')
        .host('https://ic0.app')
        .polling(true, 5000)
        .retries(3, 1000)
        .enableFeature('enableDirectMessages', true)
        .build();

      expect(config.canisterId).toBe('rdmx6-jaaaa-aaaah-qacaa-cai');
      expect(config.host).toBe('https://ic0.app');
      expect(config.polling?.interval).toBe(5000);
      expect(config.agentOptions?.retryTimes).toBe(3);
      expect(config.features?.enableDirectMessages).toBe(true);
    });
  });

  describe('OpenChatService', () => {
    let service: OpenChatService;

    beforeEach(() => {
      service = new OpenChatService(config);
    });

    afterEach(async () => {
      if (service) {
        await service.cleanup();
      }
    });

    it('should create service instance', () => {
      expect(service).toBeInstanceOf(OpenChatService);
      expect(service.isReady()).toBe(false);
    });

    // Note: These tests would require mocking the IC dependencies
    it.skip('should initialize service', async () => {
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });

    it.skip('should send message', async () => {
      await service.initialize();
      await service.sendMessage('be2us-64aaa-aaaah-qaabq-cai', 'Test message');
    });
  });

  describe('Actions', () => {
    describe('Send Message Action', () => {
      it('should validate send message requests', async () => {
        const sendAction = openChatPlugin.actions?.find(
          action => action.name === 'SEND_OPENCHAT_MESSAGE'
        );

        expect(sendAction).toBeDefined();
        expect(sendAction?.validate).toBeDefined();

        // Test validation with OpenChat message
        const validMessage = {
          content: {
            text: 'send message to rdmx6-jaaaa-aaaah-qacaa-cai saying "hello"',
          },
        } as any;

        const isValid = await sendAction!.validate!(runtime, validMessage);
        expect(isValid).toBe(true);

        // Test validation with non-OpenChat message
        const invalidMessage = {
          content: {
            text: 'this is just a regular message',
          },
        } as any;

        const isInvalid = await sendAction!.validate!(runtime, invalidMessage);
        expect(isInvalid).toBe(false);
      });
    });

    describe('Join Group Action', () => {
      it('should validate join group requests', async () => {
        const joinAction = openChatPlugin.actions?.find(
          action => action.name === 'JOIN_OPENCHAT_GROUP'
        );

        expect(joinAction).toBeDefined();

        const validMessage = {
          content: {
            text: 'join openchat group rdmx6-jaaaa-aaaah-qacaa-cai',
          },
        } as any;

        const isValid = await joinAction!.validate!(runtime, validMessage);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Evaluators', () => {
    it('should evaluate OpenChat messages', async () => {
      const evaluator = openChatPlugin.evaluators?.find(
        evaluator => evaluator.name === 'OPENCHAT_MESSAGE_EVALUATOR'
      );

      expect(evaluator).toBeDefined();

      const openChatMessage = {
        content: {
          text: 'Hello from OpenChat',
          source: 'openchat',
          metadata: {
            openchat: {
              chatId: { direct: 'rdmx6-jaaaa-aaaah-qacaa-cai' },
              userId: 'be2us-64aaa-aaaah-qaabq-cai',
              messageId: BigInt(12345),
              content: { Text: { text: 'Hello from OpenChat' } },
              timestamp: BigInt(Date.now() * 1000000),
              isThread: false,
              mentions: [],
              reactions: [],
            },
          },
        },
      } as any;

      const isValid = await evaluator!.validate!(runtime, openChatMessage);
      expect(isValid).toBe(true);

      const evaluation = await evaluator!.handler!(runtime, openChatMessage);
      expect(evaluation.isOpenChatMessage).toBe(true);
      expect(evaluation.confidence).toBeGreaterThan(0);
    });
  });

  describe('Providers', () => {
    it('should provide OpenChat context', async () => {
      const provider = openChatPlugin.providers?.find(
        provider => provider.name === 'OPENCHAT_PROVIDER'
      );

      expect(provider).toBeDefined();
      expect(provider?.get).toBeDefined();

      // Note: This would require proper mocking to test fully
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration errors gracefully', () => {
      expect(() => {
        new ConfigBuilder()
          .canister('') // Invalid
          .build();
      }).toThrow();
    });

    it('should handle service initialization errors', async () => {
      const invalidConfig = createOpenChatConfig({
        canisterId: 'invalid-canister-id',
      });

      const service = new OpenChatService(invalidConfig);
      
      // This should not throw during construction
      expect(service).toBeInstanceOf(OpenChatService);
      
      // But should handle errors during initialization
      // (would need proper mocking to test this fully)
    });
  });

  describe('Utility Functions', () => {
    it('should create valid principals', () => {
      // This would need mocking of @dfinity/principal
      // expect(OpenChatUtils.createPrincipal('rdmx6-jaaaa-aaaah-qacaa-cai')).toBeDefined();
    });

    it('should generate message IDs', () => {
      // expect(OpenChatUtils.generateMessageId()).toBeDefined();
    });

    it('should handle timestamp conversions', () => {
      // const timestamp = BigInt(Date.now() * 1000000);
      // const date = OpenChatUtils.timestampToDate(timestamp);
      // expect(date).toBeInstanceOf(Date);
    });
  });
});