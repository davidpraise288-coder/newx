#!/usr/bin/env ts-node

/**
 * Advanced OpenChat Plugin Usage Example
 * 
 * This example demonstrates advanced features including:
 * - Custom message handling
 * - Group management
 * - Event listening
 * - Error handling
 * - Configuration management
 */

import { AgentRuntime } from '@elizaos/core';
import { 
  openChatPlugin, 
  OpenChatService,
  OpenChatMessageHandler,
  OpenChatAuth,
  createConfig,
  loadConfigFromEnv,
  OpenChatUtils
} from '../src/index.js';

async function advancedUsageExample() {
  console.log('🚀 OpenChat Plugin Advanced Usage Example');
  console.log('=========================================\n');

  try {
    // 1. Advanced configuration using builder pattern
    console.log('1. Creating advanced configuration...');
    const config = createConfig()
      .canister('rdmx6-jaaaa-aaaah-qacaa-cai') // Replace with actual canister ID
      .host('https://ic0.app')
      .identity('./advanced-example-identity.json')
      .polling(true, 3000)
      .retries(5, 2000)
      .enableFeature('enableDirectMessages', true)
      .enableFeature('enableGroupChats', true)
      .enableFeature('enableCommunities', true)
      .enableFeature('enableCrypto', false)
      .build();
    
    console.log('✅ Advanced configuration created\n');

    // 2. Custom authentication setup
    console.log('2. Setting up custom authentication...');
    const auth = new OpenChatAuth({
      identityPath: './advanced-example-identity.json',
      useInternetIdentity: false,
    });

    const identity = await auth.initialize();
    console.log('Agent Principal:', identity.getPrincipal().toString());
    console.log('✅ Authentication configured\n');

    // 3. Custom message handler with event listeners
    console.log('3. Setting up custom message handler...');
    const messageHandler = new OpenChatMessageHandler({
      config,
      onMessage: async (messageWrapper) => {
        console.log('📨 Received message:', {
          timestamp: OpenChatUtils.timestampToDate(messageWrapper.timestamp),
          sender: 'Message' in messageWrapper.event ? 
            messageWrapper.event.Message.sender.toString() : 'Unknown',
          content: 'Message' in messageWrapper.event ? 
            OpenChatUtils.extractTextFromMessage(messageWrapper.event.Message.content) : 'N/A',
        });

        // Custom message processing logic here
        await handleIncomingMessage(messageWrapper, messageHandler);
      },
      onError: (error) => {
        console.error('❌ OpenChat error:', error);
        // Custom error handling logic here
      },
    });

    await messageHandler.initialize();
    console.log('✅ Message handler configured\n');

    // 4. Demonstrate advanced operations
    console.log('4. Demonstrating advanced operations...');
    
    // Example: Send a message with custom formatting
    const exampleRecipient = 'be2us-64aaa-aaaah-qaabq-cai'; // Replace with actual principal
    try {
      await messageHandler.sendMessage(
        OpenChatUtils.createPrincipal(exampleRecipient),
        'Hello from advanced ElizaOS agent! 🤖',
        {
          senderName: 'Advanced Agent',
          senderDisplayName: 'ElizaOS Advanced Bot',
        }
      );
      console.log('✅ Advanced message sent');
    } catch (error) {
      console.log('ℹ️ Message sending skipped (recipient may not exist)');
    }

    // Example: Join a group with error handling
    const exampleGroupId = 'rdmx6-jaaaa-aaaah-qacaa-cai'; // Replace with actual group
    try {
      await messageHandler.joinGroup(OpenChatUtils.createPrincipal(exampleGroupId));
      console.log('✅ Joined group successfully');
    } catch (error) {
      console.log('ℹ️ Group joining skipped (group may not exist or require invite)');
    }

    // 5. Monitor chat memories and context
    console.log('\n5. Monitoring chat context...');
    const memories = messageHandler.getAllChatMemories();
    console.log(`Active chats: ${memories.size}`);
    
    for (const [chatKey, memory] of memories) {
      console.log(`- ${chatKey}: ${memory.participantCount} participants, Role: ${Object.keys(memory.role)[0]}`);
    }

    // 6. Demonstrate service integration
    console.log('\n6. Service integration example...');
    const service = new OpenChatService(config);
    await service.initialize();

    if (service.isReady()) {
      console.log('Service ready for integration');
      console.log('Current user:', service.getCurrentUser());
    }

    // 7. Simulate message polling for demonstration
    console.log('\n7. Starting message polling demonstration...');
    console.log('Polling for messages for 10 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 8. Clean up
    console.log('\n8. Cleaning up resources...');
    messageHandler.stopPolling();
    await messageHandler.cleanup();
    await service.cleanup();
    await auth.cleanup();
    
    console.log('✅ All resources cleaned up\n');

    console.log('🎉 Advanced usage example completed successfully!');
    console.log('\nAdvanced features demonstrated:');
    console.log('- Custom configuration with builder pattern');
    console.log('- Advanced authentication setup');
    console.log('- Custom message and error handlers');
    console.log('- Group operations with error handling');
    console.log('- Chat memory and context monitoring');
    console.log('- Service integration patterns');
    console.log('- Proper resource cleanup');

  } catch (error) {
    console.error('❌ Error in advanced usage example:', error);
    process.exit(1);
  }
}

/**
 * Custom message handling logic
 */
async function handleIncomingMessage(
  messageWrapper: any,
  messageHandler: OpenChatMessageHandler
): Promise<void> {
  if (!('Message' in messageWrapper.event)) {
    return;
  }

  const message = messageWrapper.event.Message;
  const textContent = OpenChatUtils.extractTextFromMessage(message.content);
  
  if (!textContent) {
    console.log('📎 Received non-text message');
    return;
  }

  // Example: Auto-respond to specific keywords
  const lowerText = textContent.toLowerCase();
  
  if (lowerText.includes('hello') || lowerText.includes('hi')) {
    try {
      await messageHandler.sendMessage(
        message.sender,
        'Hello! I\'m an ElizaOS agent powered by OpenChat. How can I help you?',
        {
          senderName: 'ElizaOS Agent',
          senderDisplayName: 'Helpful Assistant',
        }
      );
      console.log('👋 Sent greeting response');
    } catch (error) {
      console.error('Failed to send greeting response:', error);
    }
  }

  if (lowerText.includes('help') || lowerText.includes('commands')) {
    try {
      const helpMessage = `
Available commands:
• Send messages to any OpenChat user
• Join and leave groups
• Get message history
• Handle crypto transactions (if enabled)

Just talk to me naturally, and I'll help you with OpenChat operations!
      `.trim();

      await messageHandler.sendMessage(
        message.sender,
        helpMessage,
        {
          senderName: 'ElizaOS Agent',
          senderDisplayName: 'Help Assistant',
        }
      );
      console.log('ℹ️ Sent help response');
    } catch (error) {
      console.error('Failed to send help response:', error);
    }
  }

  // Example: Log interesting message patterns
  if (lowerText.includes('elizaos') || lowerText.includes('agent')) {
    console.log('🤖 Message mentions ElizaOS or agent');
  }

  if (message.reactions.length > 0) {
    console.log('😊 Message has reactions:', message.reactions.map(r => r.reaction).join(', '));
  }
}

// Run the example
if (require.main === module) {
  advancedUsageExample().catch(console.error);
}

export { advancedUsageExample };