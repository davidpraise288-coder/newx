#!/usr/bin/env ts-node

/**
 * Basic OpenChat Plugin Usage Example
 * 
 * This example demonstrates how to set up and use the OpenChat plugin
 * with an ElizaOS agent.
 */

import { AgentRuntime } from '@elizaos/core';
import { 
  openChatPlugin, 
  createOpenChatConfig, 
  initializeOpenChatPlugin,
  OpenChatService 
} from '../src/index.js';

async function basicUsageExample() {
  console.log('🚀 OpenChat Plugin Basic Usage Example');
  console.log('=====================================\n');

  try {
    // 1. Create OpenChat configuration
    console.log('1. Creating OpenChat configuration...');
    const config = createOpenChatConfig({
      canisterId: 'rdmx6-jaaaa-aaaah-qacaa-cai', // Replace with actual canister ID
      host: 'https://ic0.app',
      enablePolling: true,
      pollingInterval: 5000,
      features: {
        enableDirectMessages: true,
        enableGroupChats: true,
        enableCommunities: false,
        enableCrypto: false,
      },
    });
    console.log('✅ Configuration created\n');

    // 2. Create and initialize agent runtime
    console.log('2. Creating agent runtime...');
    const runtime = new AgentRuntime({
      databaseAdapter: null, // Use memory adapter for example
      token: 'example-token',
      plugins: [openChatPlugin],
    });

    // Initialize the OpenChat plugin
    await initializeOpenChatPlugin(runtime, config);
    console.log('✅ Agent runtime initialized\n');

    // 3. Demonstrate plugin functionality
    console.log('3. Testing plugin functionality...');
    
    // The plugin is now active and will:
    // - Listen for OpenChat messages
    // - Respond to commands like "send message to [principal] saying [message]"
    // - Handle group operations
    // - Provide OpenChat context to the agent

    console.log('✅ Plugin is now active and ready to handle OpenChat interactions\n');

    // 4. Example of direct service usage (without full agent)
    console.log('4. Demonstrating direct service usage...');
    const service = new OpenChatService(config);
    await service.initialize();

    console.log('Current agent principal:', service.getCurrentUser());
    console.log('Service ready:', service.isReady());

    // Clean up
    await service.cleanup();
    console.log('✅ Service example completed\n');

    console.log('🎉 Basic usage example completed successfully!');
    console.log('\nNext steps:');
    console.log('- Replace the canister ID with your actual OpenChat canister');
    console.log('- Configure your agent character and behavior');
    console.log('- Test with real OpenChat messages');

  } catch (error) {
    console.error('❌ Error in basic usage example:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };