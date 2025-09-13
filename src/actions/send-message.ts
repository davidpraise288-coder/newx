import {
  ActionExample,
  Content,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  type Action,
} from '@elizaos/core';
import { Principal } from '@dfinity/principal';
import { OpenChatMessageHandler } from '../utils/message-handler.js';
import { OpenChatUtils } from '../utils/ic-client.js';
import { OpenChatConfig } from '../types/openchat.types.js';

export const sendMessageAction: Action = {
  name: 'SEND_OPENCHAT_MESSAGE',
  similes: [
    'SEND_MESSAGE_OPENCHAT',
    'OPENCHAT_SEND',
    'MESSAGE_OPENCHAT',
    'SEND_TO_OPENCHAT',
    'OPENCHAT_MESSAGE',
  ],
  description: 'Send a message to OpenChat user or group',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as Content;
    
    // Check if this is an OpenChat-related message
    if (content.text?.toLowerCase().includes('openchat') ||
        content.text?.toLowerCase().includes('send message') ||
        content.action === 'SEND_OPENCHAT_MESSAGE') {
      return true;
    }

    // Check if recipient looks like a Principal
    const principalRegex = /[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}/;
    if (principalRegex.test(content.text || '')) {
      return true;
    }

    return false;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      console.log('Executing OpenChat send message action');

      // Get OpenChat configuration from runtime
      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      if (!config) {
        throw new Error('OpenChat configuration not found');
      }

      // Initialize message handler
      const messageHandler = new OpenChatMessageHandler({ config });
      await messageHandler.initialize();

      // Parse message content
      const content = message.content as Content;
      const text = content.text || '';

      // Extract recipient and message from text
      const { recipient, messageText } = parseMessageCommand(text);

      if (!recipient) {
        throw new Error('No recipient specified. Please provide a Principal ID.');
      }

      if (!messageText) {
        throw new Error('No message text provided.');
      }

      // Convert recipient to Principal
      const recipientPrincipal = OpenChatUtils.createPrincipal(recipient);

      // Send the message
      await messageHandler.sendMessage(
        recipientPrincipal,
        messageText,
        {
          senderName: runtime.character?.name || 'ElizaOS Agent',
          senderDisplayName: runtime.character?.name || 'ElizaOS Agent',
        }
      );

      // Clean up
      await messageHandler.cleanup();

      // Create success response
      const response: Content = {
        text: `Message sent successfully to ${recipient}`,
        action: 'OPENCHAT_MESSAGE_SENT',
        source: message.content.source,
      };

      // Call callback if provided
      if (callback) {
        callback(response);
      }

      return response;

    } catch (error) {
      console.error('Error in sendMessageAction:', error);
      
      const errorResponse: Content = {
        text: `Failed to send OpenChat message: ${error.message}`,
        action: 'OPENCHAT_MESSAGE_ERROR',
        source: message.content.source,
      };

      if (callback) {
        callback(errorResponse);
      }

      return errorResponse;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Send a message to rdmx6-jaaaa-aaaah-qacaa-cai saying "Hello from ElizaOS!"',
          action: 'SEND_OPENCHAT_MESSAGE',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Message sent successfully to rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'OPENCHAT_MESSAGE_SENT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'openchat send "How are you today?" to be2us-64aaa-aaaah-qaabq-cai',
          action: 'SEND_OPENCHAT_MESSAGE',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Message sent successfully to be2us-64aaa-aaaah-qaabq-cai',
          action: 'OPENCHAT_MESSAGE_SENT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Message rdmx6-jaaaa-aaaah-qacaa-cai: "Thanks for the help!"',
          action: 'SEND_OPENCHAT_MESSAGE',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Message sent successfully to rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'OPENCHAT_MESSAGE_SENT',
        },
      },
    ],
  ] as ActionExample[][],
};

/**
 * Parse message command to extract recipient and message text
 */
function parseMessageCommand(text: string): { recipient?: string; messageText?: string } {
  // Pattern 1: "Send message to PRINCIPAL saying MESSAGE"
  let match = text.match(/send.*?message.*?to\s+([a-z0-9-]+).*?saying\s+"([^"]+)"/i);
  if (match) {
    return { recipient: match[1], messageText: match[2] };
  }

  // Pattern 2: "openchat send MESSAGE to PRINCIPAL"
  match = text.match(/openchat\s+send\s+"([^"]+)"\s+to\s+([a-z0-9-]+)/i);
  if (match) {
    return { recipient: match[2], messageText: match[1] };
  }

  // Pattern 3: "Message PRINCIPAL: MESSAGE"
  match = text.match(/message\s+([a-z0-9-]+):\s*"([^"]+)"/i);
  if (match) {
    return { recipient: match[1], messageText: match[2] };
  }

  // Pattern 4: Just principal and quoted message
  match = text.match(/([a-z0-9-]+).*?"([^"]+)"/);
  if (match) {
    return { recipient: match[1], messageText: match[2] };
  }

  // Pattern 5: Extract any principal-like string and remaining text
  const principalRegex = /([a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3})/;
  const principalMatch = text.match(principalRegex);
  if (principalMatch) {
    const recipient = principalMatch[1];
    const messageText = text.replace(principalMatch[0], '').replace(/send|message|to|openchat|:|"/gi, '').trim();
    if (messageText) {
      return { recipient, messageText };
    }
  }

  return {};
}