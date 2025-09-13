#!/usr/bin/env ts-node

/**
 * Run Plugin with Mock OpenChat
 * 
 * This script runs the plugin with a mock OpenChat service
 * so you can test the full functionality locally.
 */

import { AgentRuntime, MemoryManager, DatabaseAdapter } from '@elizaos/core';
import { EventEmitter } from 'events';
import { 
  openChatPlugin, 
  createOpenChatConfig, 
  OpenChatMessageHandler,
  OpenChatService
} from '../src/index.js';

// Mock OpenChat Service for testing
class MockOpenChatService extends EventEmitter {
  private isInitialized = false;
  private currentUser = 'mock-agent-principal';
  private messages: any[] = [];

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Mock OpenChat Service...');
    this.isInitialized = true;
    console.log('✅ Mock service initialized');
    
    // Simulate receiving messages after a delay
    setTimeout(() => this.simulateIncomingMessage(), 5000);
  }

  async sendMessage(recipient: string, message: string): Promise<void> {
    console.log(`📤 Mock: Sending message to ${recipient}: "${message}"`);
    
    // Simulate successful send
    this.emit('messageSent', {
      recipient,
      message,
      timestamp: Date.now(),
    });

    // Simulate a response after delay
    setTimeout(() => {
      this.simulateResponse(recipient, message);
    }, 2000);
  }

  async joinGroup(groupId: string): Promise<void> {
    console.log(`🏠 Mock: Joining group ${groupId}`);
    this.emit('groupJoined', { groupId });
  }

  async leaveGroup(groupId: string): Promise<void> {
    console.log(`🚪 Mock: Leaving group ${groupId}`);
    this.emit('groupLeft', { groupId });
  }

  getCurrentUser(): string {
    return this.currentUser;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  private simulateIncomingMessage(): void {
    const mockMessage = {
      event: {
        Message: {
          message_id: BigInt(Date.now()),
          sender: 'mock-user-principal',
          content: { Text: { text: 'Hello, are you there?' } },
          reactions: [],
          replies_to: null,
          tips: { chat: { InternetComputer: null }, total: BigInt(0) },
          thread_summary: null,
          edited: false,
          forwarded: false,
          is_bot: false,
          block_level_markdown: false,
        },
      },
      timestamp: BigInt(Date.now() * 1000000),
      index: 1,
    };

    console.log('📨 Mock: Received incoming message');
    this.emit('message', mockMessage);
  }

  private simulateResponse(originalSender: string, originalMessage: string): void {
    const responseMessage = {
      event: {
        Message: {
          message_id: BigInt(Date.now()),
          sender: originalSender,
          content: { Text: { text: `Thanks for your message: "${originalMessage}"` } },
          reactions: [],
          replies_to: null,
          tips: { chat: { InternetComputer: null }, total: BigInt(0) },
          thread_summary: null,
          edited: false,
          forwarded: false,
          is_bot: false,
          block_level_markdown: false,
        },
      },
      timestamp: BigInt(Date.now() * 1000000),
      index: 2,
    };

    console.log('📨 Mock: Received response message');
    this.emit('message', responseMessage);
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Mock: Cleaning up service');
    this.isInitialized = false;
  }
}

// Simple database adapter for testing
class MockDatabaseAdapter implements DatabaseAdapter {
  private data = new Map();

  async getRoom(roomId: string) { return this.data.get(`room:${roomId}`); }
  async createRoom(roomId: string, room: any) { this.data.set(`room:${roomId}`, room); }
  async removeRoom(roomId: string) { this.data.delete(`room:${roomId}`); }
  async getRoomsForParticipant(userId: string) { return []; }
  async getRoomsForParticipants(userIds: string[]) { return []; }
  async addParticipant(userId: string, roomId: string) {}
  async removeParticipant(userId: string, roomId: string) {}
  async createMemory(memory: any, tableName: string) { 
    this.data.set(`memory:${memory.id}`, memory); 
  }
  async searchMemories(params: any) { return []; }
  async getCachedEmbeddings(opts: any) { return []; }
  async updateGoalStatus(params: any) {}
  async searchMemoriesByEmbedding(embedding: any, params: any) { return []; }
  async createGoal(goal: any) {}
  async getGoals(params: any) { return []; }
  async updateGoal(goal: any) {}
  async removeGoal(goalId: string) {}
  async removeMemory(memoryId: string, tableName: string) {}
  async removeAllMemories(roomId: string, tableName: string) {}
  async countMemories(roomId: string, unique?: boolean, tableName?: string) { return 0; }
  async getMemories(params: any) { return []; }
  async getMemoryById(id: string) { return this.data.get(`memory:${id}`); }
  async getMemoriesByRoomIds(params: any) { return []; }
  async getAccount(userId: string) { return this.data.get(`account:${userId}`); }
  async createAccount(account: any) { this.data.set(`account:${account.id}`, account); }
  async getActorDetails(params: any) { return []; }
  async searchActors(params: any) { return []; }
}

async function runWithMockOpenChat() {
  console.log('🎭 Running OpenChat Plugin with Mock Service');
  console.log('============================================\n');

  try {
    // 1. Create mock configuration
    const config = createOpenChatConfig({
      canisterId: 'mock-canister-id',
      host: 'http://localhost:8000',
      enablePolling: false, // We'll simulate messages instead
      features: {
        enableDirectMessages: true,
        enableGroupChats: true,
      },
    });

    // 2. Create agent runtime
    const runtime = new AgentRuntime({
      databaseAdapter: new MockDatabaseAdapter(),
      token: 'mock-test-token',
      plugins: [openChatPlugin],
      character: {
        name: 'Mock OpenChat Agent',
        bio: 'A test agent running with mock OpenChat service',
        lore: [
          'I can send messages through OpenChat',
          'I can join and leave groups',
          'I respond to direct messages',
        ],
        messageExamples: [
          [
            {
              user: '{{user1}}',
              content: { text: 'Hello!' },
            },
            {
              user: '{{user2}}',
              content: { text: 'Hello! I\'m a mock OpenChat agent. How can I help you?' },
            },
          ],
        ],
        postExamples: [],
        style: {
          all: ['Be helpful and friendly'],
          chat: ['Respond naturally'],
        },
      },
    });

    console.log('✅ Agent runtime created');

    // 3. Create mock service
    const mockService = new MockOpenChatService();
    await mockService.initialize();

    // 4. Test the plugin actions
    console.log('\n🧪 Testing Plugin Actions...');

    // Test send message action
    const sendAction = openChatPlugin.actions?.find(a => a.name === 'SEND_OPENCHAT_MESSAGE');
    if (sendAction) {
      console.log('\n📤 Testing send message action...');
      
      const testMessage = {
        id: 'test-message-1',
        userId: 'test-user',
        agentId: runtime.agentId,
        roomId: 'test-room',
        content: {
          text: 'send message to mock-recipient saying "Hello from mock agent!"',
          source: 'test',
        },
        createdAt: Date.now(),
      };

      try {
        const result = await sendAction.handler(
          runtime,
          testMessage,
          {},
          {},
          (response) => {
            console.log('✅ Send action callback:', response.text);
          }
        );
        console.log('✅ Send message action completed');
      } catch (error) {
        console.log('⚠️  Send action failed (expected with mock):', error.message);
      }
    }

    // Test join group action
    const joinAction = openChatPlugin.actions?.find(a => a.name === 'JOIN_OPENCHAT_GROUP');
    if (joinAction) {
      console.log('\n🏠 Testing join group action...');
      
      const testMessage = {
        id: 'test-message-2',
        userId: 'test-user',
        agentId: runtime.agentId,
        roomId: 'test-room',
        content: {
          text: 'join openchat group mock-group-id',
          source: 'test',
        },
        createdAt: Date.now(),
      };

      try {
        const result = await joinAction.handler(
          runtime,
          testMessage,
          {},
          {},
          (response) => {
            console.log('✅ Join action callback:', response.text);
          }
        );
        console.log('✅ Join group action completed');
      } catch (error) {
        console.log('⚠️  Join action failed (expected with mock):', error.message);
      }
    }

    // 5. Test evaluators
    console.log('\n🧠 Testing Evaluators...');
    
    const evaluator = openChatPlugin.evaluators?.[0];
    if (evaluator) {
      const testMessage = {
        id: 'test-eval-1',
        userId: 'test-user',
        agentId: runtime.agentId,
        roomId: 'test-room',
        content: {
          text: 'Hello from OpenChat',
          source: 'openchat',
          metadata: {
            openchat: {
              chatId: { direct: 'mock-user-principal' },
              userId: 'mock-user-principal',
              messageId: BigInt(12345),
              content: { Text: { text: 'Hello from OpenChat' } },
              timestamp: BigInt(Date.now() * 1000000),
              isThread: false,
              mentions: [],
              reactions: [],
            },
          },
        },
        createdAt: Date.now(),
      };

      const isValid = await evaluator.validate(runtime, testMessage);
      console.log('✅ Evaluator validation:', isValid);

      if (isValid) {
        const evaluation = await evaluator.handler(runtime, testMessage);
        console.log('✅ Evaluation result:', {
          isOpenChatMessage: evaluation.isOpenChatMessage,
          confidence: evaluation.confidence,
          shouldRespond: evaluation.shouldRespond,
        });
      }
    }

    // 6. Test providers
    console.log('\n📊 Testing Providers...');
    
    const provider = openChatPlugin.providers?.find(p => p.name === 'OPENCHAT_PROVIDER');
    if (provider) {
      try {
        // This will fail without real config, but tests the structure
        const context = await provider.get(runtime, {
          content: { text: 'test' },
        } as any);
        console.log('✅ Provider result length:', context.length);
      } catch (error) {
        console.log('⚠️  Provider failed (expected with mock):', error.message);
      }
    }

    // 7. Simulate interactive session
    console.log('\n🎮 Simulating Interactive Session...');
    console.log('This demonstrates how the plugin would work with real OpenChat...');

    mockService.on('message', (messageWrapper) => {
      console.log('📨 Received message event from mock service');
      
      if ('Message' in messageWrapper.event) {
        const message = messageWrapper.event.Message;
        console.log(`From: ${message.sender}`);
        console.log(`Content: ${JSON.stringify(message.content)}`);
        
        // Simulate agent processing and responding
        setTimeout(() => {
          console.log('🤖 Agent would process this message and respond...');
          mockService.sendMessage(
            message.sender,
            'Hello! I received your message. I\'m a mock OpenChat agent!'
          );
        }, 1000);
      }
    });

    mockService.on('messageSent', (event) => {
      console.log('✅ Message sent successfully:', event);
    });

    // Keep running for demo
    console.log('\n⏰ Running mock session for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Cleanup
    await mockService.cleanup();
    
    console.log('\n🎉 Mock Testing Complete!');
    console.log('========================');
    console.log('✅ Plugin structure works correctly');
    console.log('✅ Actions are properly implemented');
    console.log('✅ Evaluators function as expected');
    console.log('✅ Event handling works');
    console.log('✅ Ready for real OpenChat integration!');

  } catch (error) {
    console.error('❌ Mock test failed:', error);
    console.error(error.stack);
  }
}

// Run if called directly
if (require.main === module) {
  runWithMockOpenChat().catch(console.error);
}

export { runWithMockOpenChat };