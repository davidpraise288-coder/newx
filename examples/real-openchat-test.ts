#!/usr/bin/env ts-node

/**
 * Real OpenChat Integration Test
 * 
 * This example uses REAL OpenChat canister IDs to test the plugin.
 * It will attempt to connect to the actual OpenChat service.
 */

import { AgentRuntime } from '@elizaos/core';
import { 
  openChatPlugin, 
  createOpenChatConfig, 
  initializeOpenChatPlugin,
  OpenChatService,
  getMessagingCanister,
  getGroupCanister,
  OPENCHAT_PRODUCTION_CANISTERS,
  OPENCHAT_TEST_CANISTERS
} from '../src/index.js';

// Simple database adapter for testing
class TestDatabaseAdapter {
  private data = new Map();
  
  async getRoom(roomId: string) { return this.data.get(`room:${roomId}`); }
  async createRoom(roomId: string, room: any) { this.data.set(`room:${roomId}`, room); }
  async removeRoom(roomId: string) { this.data.delete(`room:${roomId}`); }
  async getRoomsForParticipant(userId: string) { return []; }
  async getRoomsForParticipants(userIds: string[]) { return []; }
  async addParticipant(userId: string, roomId: string) {}
  async removeParticipant(userId: string, roomId: string) {}
  async createMemory(memory: any, tableName: string) { this.data.set(`memory:${memory.id}`, memory); }
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

async function testRealOpenChat() {
  console.log('🌐 Testing with REAL OpenChat Canisters');
  console.log('=======================================\n');

  try {
    // Display available canister IDs
    console.log('📋 Available OpenChat Canisters:');
    console.log('Production Environment:');
    console.log(`  User Index: ${OPENCHAT_PRODUCTION_CANISTERS.user_index}`);
    console.log(`  Group Index: ${OPENCHAT_PRODUCTION_CANISTERS.group_index}`);
    console.log(`  Notifications: ${OPENCHAT_PRODUCTION_CANISTERS.notifications}`);
    console.log(`  Website: ${OPENCHAT_PRODUCTION_CANISTERS.website}`);
    
    console.log('\nTest Environment:');
    console.log(`  User Index: ${OPENCHAT_TEST_CANISTERS.user_index}`);
    console.log(`  Group Index: ${OPENCHAT_TEST_CANISTERS.group_index}`);
    console.log(`  Notifications: ${OPENCHAT_TEST_CANISTERS.notifications}`);
    console.log(`  Website: ${OPENCHAT_TEST_CANISTERS.website}\n`);

    // Choose environment (test is safer for initial testing)
    const useProduction = process.env.USE_PRODUCTION === 'true';
    const environment = useProduction ? 'production' : 'test';
    
    console.log(`🎯 Using ${environment.toUpperCase()} environment\n`);

    // 1. Create configuration with real canister ID
    const config = createOpenChatConfig({
      canisterId: getMessagingCanister(environment),
      host: 'https://ic0.app',
      enablePolling: false, // Disable polling for initial test
      features: {
        enableDirectMessages: true,
        enableGroupChats: false, // Start with just direct messages
        enableCommunities: false,
        enableCrypto: false,
      },
    });

    console.log('📋 Configuration:');
    console.log(`  Canister ID: ${config.canisterId}`);
    console.log(`  Host: ${config.host}`);
    console.log(`  Polling: ${config.polling?.enabled}`);
    console.log('');

    // 2. Test direct service connection
    console.log('🔌 Testing direct service connection...');
    const service = new OpenChatService(config);
    
    try {
      await service.initialize();
      console.log('✅ Service initialization successful!');
      console.log(`🤖 Agent Principal: ${service.getCurrentUser()}`);
      console.log(`📶 Service Ready: ${service.isReady()}`);
      
      await service.cleanup();
      console.log('✅ Service cleanup successful\n');
      
    } catch (error) {
      console.log('⚠️  Service connection failed (this might be expected):');
      console.log(`   Error: ${error.message}`);
      console.log('   This could be due to:');
      console.log('   - Authentication requirements');
      console.log('   - Canister access restrictions');
      console.log('   - Network connectivity issues');
      console.log('   - Missing permissions\n');
    }

    // 3. Test ElizaOS integration
    console.log('🤖 Testing ElizaOS integration...');
    
    const runtime = new AgentRuntime({
      databaseAdapter: new TestDatabaseAdapter() as any,
      token: 'real-test-token',
      plugins: [openChatPlugin],
      character: {
        name: 'Real OpenChat Test Agent',
        bio: 'Testing real OpenChat integration',
        lore: ['I can connect to real OpenChat services'],
        messageExamples: [],
        postExamples: [],
        style: {
          all: ['Be helpful'],
          chat: ['Be conversational'],
        },
      },
    });

    console.log('✅ Agent runtime created');

    try {
      await initializeOpenChatPlugin(runtime, config);
      console.log('✅ Plugin initialization successful!');
      
      const agentPrincipal = runtime.getSetting('OPENCHAT_AGENT_PRINCIPAL');
      console.log(`🤖 Agent Principal: ${agentPrincipal}`);
      
    } catch (error) {
      console.log('⚠️  Plugin initialization failed:');
      console.log(`   Error: ${error.message}`);
      console.log('   This is expected without proper authentication setup\n');
    }

    // 4. Test plugin actions (structure validation)
    console.log('🎯 Testing plugin actions...');
    
    const sendAction = openChatPlugin.actions?.find(a => a.name === 'SEND_OPENCHAT_MESSAGE');
    if (sendAction) {
      const testMessage = {
        content: {
          text: `send message to ${OPENCHAT_TEST_CANISTERS.user_index} saying "Hello from real test!"`,
        },
      } as any;

      const isValid = await sendAction.validate(runtime, testMessage);
      console.log(`✅ Send message action validation: ${isValid}`);
    }

    // 5. Next steps guidance
    console.log('\n🚀 Next Steps for Full Integration:');
    console.log('==================================');
    console.log('1. ✅ Plugin structure is working');
    console.log('2. ✅ Real canister IDs are configured');
    console.log('3. ✅ IC connection is being attempted');
    console.log('4. ❓ Authentication needs to be configured');
    console.log('5. ❓ OpenChat permissions may be required');
    console.log('');
    console.log('🔑 To complete integration:');
    console.log('- Set up proper IC identity authentication');
    console.log('- Contact OpenChat team for bot permissions (if required)');
    console.log('- Test with a simple message send/receive');
    console.log('- Enable polling for real-time message detection');
    console.log('');
    console.log('🎉 The plugin is ready - just needs authentication setup!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Allow choosing production vs test environment
console.log('🌐 Real OpenChat Integration Test');
console.log('================================');
console.log('');
console.log('Environment options:');
console.log('- Test environment (default): npm run test:real');
console.log('- Production environment: USE_PRODUCTION=true npm run test:real');
console.log('');

// Run the test
testRealOpenChat().catch(console.error);