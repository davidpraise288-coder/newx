#!/usr/bin/env ts-node

/**
 * Interactive OpenChat Agent Setup
 * 
 * This example shows how to set up an agent that responds to OpenChat messages
 */

import { AgentRuntime } from '@elizaos/core';
import { 
  openChatPlugin, 
  createOpenChatConfig, 
  initializeOpenChatPlugin,
  OpenChatMessageHandler 
} from '../src/index.js';

async function setupInteractiveAgent() {
  console.log('🤖 Setting up Interactive OpenChat Agent');
  console.log('=====================================\n');

  // 1. Create configuration with polling enabled
  const config = createOpenChatConfig({
    canisterId: 'your-openchat-canister-id', // Replace with actual canister ID
    host: 'https://ic0.app',
    enablePolling: true, // IMPORTANT: Enable polling for message detection
    pollingInterval: 5000, // Check for messages every 5 seconds
    features: {
      enableDirectMessages: true,
      enableGroupChats: true,
    },
  });

  // 2. Create agent with character that responds naturally
  const runtime = new AgentRuntime({
    databaseAdapter: null,
    token: 'interactive-agent-token',
    plugins: [openChatPlugin],
    character: {
      name: 'OpenChat Assistant',
      bio: 'I am an AI assistant that can help you with OpenChat messaging and various tasks.',
      lore: [
        'I can send messages to other OpenChat users',
        'I can join and leave groups',
        'I can retrieve message history',
        'I respond to direct messages and mentions',
      ],
      messageExamples: [
        [
          {
            user: '{{user1}}',
            content: { text: 'Hello, are you there?' },
          },
          {
            user: '{{user2}}',
            content: { 
              text: 'Hello! I\'m here and ready to help. I\'m an AI assistant connected to OpenChat. What can I do for you?'
            },
          },
        ],
        [
          {
            user: '{{user1}}',
            content: { text: 'Can you help me send a message?' },
          },
          {
            user: '{{user2}}',
            content: { 
              text: 'Of course! I can help you send messages through OpenChat. Just tell me the recipient\'s Principal ID and what message you\'d like to send.'
            },
          },
        ],
      ],
      postExamples: [
        'Just sent a message successfully! ✅',
        'I\'m here and ready to help with OpenChat tasks!',
        'Feel free to ask me to send messages, join groups, or check message history.',
      ],
      style: {
        all: [
          'Be helpful and friendly',
          'Respond naturally to conversations',
          'Explain OpenChat features when relevant',
          'Use emojis appropriately',
        ],
        chat: [
          'Keep responses conversational',
          'Ask clarifying questions when needed',
          'Provide clear instructions for commands',
        ],
      },
    },
  });

  // 3. Initialize OpenChat plugin
  await initializeOpenChatPlugin(runtime, config);

  // 4. Set up custom message handling for interactive responses
  const messageHandler = new OpenChatMessageHandler({
    config,
    onMessage: async (messageWrapper) => {
      console.log('📨 New message received from OpenChat');
      
      if ('Message' in messageWrapper.event) {
        const message = messageWrapper.event.Message;
        const sender = message.sender.toString();
        
        // Skip messages from the agent itself
        const agentPrincipal = runtime.getSetting('OPENCHAT_AGENT_PRINCIPAL');
        if (sender === agentPrincipal) {
          return;
        }

        console.log(`From: ${sender.substring(0, 8)}...`);
        console.log(`Content: ${JSON.stringify(message.content)}`);

        // Process message through ElizaOS
        const memory = {
          id: `openchat-${message.message_id}`,
          userId: sender,
          agentId: runtime.agentId,
          roomId: `openchat-${sender}`,
          content: {
            text: extractTextFromMessage(message.content),
            source: 'openchat',
            metadata: {
              openchat: {
                chatId: { direct: sender },
                userId: sender,
                messageId: message.message_id,
                content: message.content,
                timestamp: messageWrapper.timestamp,
                isThread: false,
                mentions: [],
                reactions: message.reactions,
              },
            },
          },
          createdAt: Date.now(),
        };

        // Let ElizaOS process and potentially respond
        await runtime.processActions(memory);
      }
    },
    onError: (error) => {
      console.error('❌ OpenChat error:', error);
    },
  });

  await messageHandler.initialize();

  console.log('✅ Interactive agent is now running!');
  console.log('\n📱 How to interact:');
  console.log('1. Send a direct message to your agent on OpenChat');
  console.log('2. The agent will automatically respond');
  console.log('3. Try commands like:');
  console.log('   - "Hello, are you there?"');
  console.log('   - "Send message to [principal] saying [message]"');
  console.log('   - "Join group [principal]"');
  console.log('   - "Help me with OpenChat"');

  // Keep the agent running
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down agent...');
    await messageHandler.cleanup();
    process.exit(0);
  });

  return { runtime, messageHandler };
}

/**
 * Extract text from OpenChat message content
 */
function extractTextFromMessage(content: any): string {
  if (content && typeof content === 'object' && 'Text' in content) {
    return content.Text.text;
  }
  return '[Non-text message]';
}

// Run the interactive agent
if (require.main === module) {
  setupInteractiveAgent().catch(console.error);
}

export { setupInteractiveAgent };