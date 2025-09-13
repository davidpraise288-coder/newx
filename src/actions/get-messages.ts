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

export const getMessagesAction: Action = {
  name: 'GET_OPENCHAT_MESSAGES',
  similes: [
    'OPENCHAT_GET_MESSAGES',
    'FETCH_OPENCHAT_MESSAGES',
    'READ_OPENCHAT_MESSAGES',
    'OPENCHAT_MESSAGES',
    'CHECK_OPENCHAT_MESSAGES',
    'OPENCHAT_HISTORY',
  ],
  description: 'Get messages from OpenChat user or group',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as Content;
    
    // Check if this is a get messages request
    if ((content.text?.toLowerCase().includes('get') ||
         content.text?.toLowerCase().includes('fetch') ||
         content.text?.toLowerCase().includes('read') ||
         content.text?.toLowerCase().includes('check') ||
         content.text?.toLowerCase().includes('show')) &&
        (content.text?.toLowerCase().includes('messages') ||
         content.text?.toLowerCase().includes('history')) &&
        (content.text?.toLowerCase().includes('openchat'))) {
      return true;
    }

    if (content.action === 'GET_OPENCHAT_MESSAGES') {
      return true;
    }

    // Check if text contains a Principal ID and message-related keywords
    const principalRegex = /[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}/;
    if (principalRegex.test(content.text || '') && 
        (content.text?.toLowerCase().includes('messages') ||
         content.text?.toLowerCase().includes('history'))) {
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
      console.log('Executing OpenChat get messages action');

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

      // Extract user/group ID and options from text
      const { userId, maxMessages, startIndex } = parseGetMessagesCommand(text);

      if (!userId) {
        throw new Error('No user/group ID specified. Please provide a Principal ID.');
      }

      // Convert user ID to Principal
      const userPrincipal = OpenChatUtils.createPrincipal(userId);

      // Get messages via IC client directly
      const client = (messageHandler as any).client;
      const response = await client.getMessages(userPrincipal, {
        maxMessages: maxMessages || 10,
        startIndex: startIndex || 0,
        ascending: false, // Get most recent first
      });

      // Clean up
      await messageHandler.cleanup();

      let responseText = '';
      
      if ('Success' in response) {
        const messages = response.Success.messages;
        
        if (messages.length === 0) {
          responseText = `No messages found for ${userId}`;
        } else {
          responseText = `Found ${messages.length} messages from ${userId}:\n\n`;
          
          messages.forEach((messageWrapper, index) => {
            if ('Message' in messageWrapper.event) {
              const msg = messageWrapper.event.Message;
              const timestamp = OpenChatUtils.timestampToDate(messageWrapper.timestamp);
              const textContent = OpenChatUtils.extractTextFromMessage(msg.content) || '[Non-text message]';
              
              responseText += `${index + 1}. [${timestamp.toLocaleString()}] ${msg.sender.toString()}: ${textContent}\n`;
            }
          });
        }
      } else {
        responseText = `Failed to get messages: ${JSON.stringify(response)}`;
      }

      // Create success response
      const successResponse: Content = {
        text: responseText,
        action: 'OPENCHAT_MESSAGES_RETRIEVED',
        source: message.content.source,
      };

      // Call callback if provided
      if (callback) {
        callback(successResponse);
      }

      return successResponse;

    } catch (error) {
      console.error('Error in getMessagesAction:', error);
      
      const errorResponse: Content = {
        text: `Failed to get OpenChat messages: ${error.message}`,
        action: 'OPENCHAT_MESSAGES_ERROR',
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
          text: 'Get OpenChat messages from rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'GET_OPENCHAT_MESSAGES',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Found 3 messages from rdmx6-jaaaa-aaaah-qacaa-cai:\n\n1. [12/15/2024, 10:30:00 AM] rdmx6-jaaaa-aaaah-qacaa-cai: Hello there!\n2. [12/15/2024, 10:25:00 AM] rdmx6-jaaaa-aaaah-qacaa-cai: How are you?\n3. [12/15/2024, 10:20:00 AM] rdmx6-jaaaa-aaaah-qacaa-cai: Good morning!',
          action: 'OPENCHAT_MESSAGES_RETRIEVED',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'openchat fetch last 5 messages from be2us-64aaa-aaaah-qaabq-cai',
          action: 'GET_OPENCHAT_MESSAGES',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Found 5 messages from be2us-64aaa-aaaah-qaabq-cai:\n\n1. [12/15/2024, 11:00:00 AM] be2us-64aaa-aaaah-qaabq-cai: See you later!\n2. [12/15/2024, 10:55:00 AM] be2us-64aaa-aaaah-qaabq-cai: Thanks for the info\n3. [12/15/2024, 10:50:00 AM] be2us-64aaa-aaaah-qaabq-cai: That sounds good\n4. [12/15/2024, 10:45:00 AM] be2us-64aaa-aaaah-qaabq-cai: I understand\n5. [12/15/2024, 10:40:00 AM] be2us-64aaa-aaaah-qaabq-cai: Hello!',
          action: 'OPENCHAT_MESSAGES_RETRIEVED',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Show me the message history with rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'GET_OPENCHAT_MESSAGES',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Found 2 messages from rdmx6-jaaaa-aaaah-qacaa-cai:\n\n1. [12/15/2024, 2:30:00 PM] rdmx6-jaaaa-aaaah-qacaa-cai: Thanks for your help!\n2. [12/15/2024, 2:15:00 PM] rdmx6-jaaaa-aaaah-qacaa-cai: Can you help me with this?',
          action: 'OPENCHAT_MESSAGES_RETRIEVED',
        },
      },
    ],
  ] as ActionExample[][],
};

/**
 * Parse get messages command to extract user ID and options
 */
function parseGetMessagesCommand(text: string): { 
  userId?: string; 
  maxMessages?: number; 
  startIndex?: number; 
} {
  // Pattern 1: "Get OpenChat messages from PRINCIPAL"
  let match = text.match(/get.*?openchat.*?messages.*?from\s+([a-z0-9-]+)/i);
  if (match) {
    return { userId: match[1] };
  }

  // Pattern 2: "openchat fetch last NUMBER messages from PRINCIPAL"
  match = text.match(/openchat.*?fetch.*?last\s+(\d+).*?messages.*?from\s+([a-z0-9-]+)/i);
  if (match) {
    return { 
      userId: match[2], 
      maxMessages: parseInt(match[1]) 
    };
  }

  // Pattern 3: "Show me message history with PRINCIPAL"
  match = text.match(/show.*?message.*?history.*?with\s+([a-z0-9-]+)/i);
  if (match) {
    return { userId: match[1] };
  }

  // Pattern 4: "Check messages from PRINCIPAL"
  match = text.match(/check.*?messages.*?from\s+([a-z0-9-]+)/i);
  if (match) {
    return { userId: match[1] };
  }

  // Pattern 5: "Read PRINCIPAL messages"
  match = text.match(/read\s+([a-z0-9-]+).*?messages/i);
  if (match) {
    return { userId: match[1] };
  }

  // Pattern 6: Extract any principal-like string from message context
  const principalRegex = /([a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3})/;
  const principalMatch = text.match(principalRegex);
  if (principalMatch && 
      (text.toLowerCase().includes('messages') || 
       text.toLowerCase().includes('history'))) {
    const userId = principalMatch[1];
    
    // Look for number of messages
    const numberMatch = text.match(/(\d+).*?messages/i);
    const maxMessages = numberMatch ? parseInt(numberMatch[1]) : undefined;
    
    return { userId, maxMessages };
  }

  return {};
}