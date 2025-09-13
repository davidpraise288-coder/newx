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

export const leaveGroupAction: Action = {
  name: 'LEAVE_OPENCHAT_GROUP',
  similes: [
    'OPENCHAT_LEAVE_GROUP',
    'LEAVE_GROUP_OPENCHAT',
    'OPENCHAT_LEAVE',
    'LEAVE_OPENCHAT',
    'OPENCHAT_GROUP_LEAVE',
    'EXIT_OPENCHAT_GROUP',
  ],
  description: 'Leave an OpenChat group or community',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as Content;
    
    // Check if this is a leave group request
    if ((content.text?.toLowerCase().includes('leave') || 
         content.text?.toLowerCase().includes('exit')) &&
        (content.text?.toLowerCase().includes('openchat') ||
         content.text?.toLowerCase().includes('group') ||
         content.text?.toLowerCase().includes('community'))) {
      return true;
    }

    if (content.action === 'LEAVE_OPENCHAT_GROUP') {
      return true;
    }

    // Check if text contains a Principal ID and leave keyword
    const principalRegex = /[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}/;
    if (principalRegex.test(content.text || '') && 
        (content.text?.toLowerCase().includes('leave') ||
         content.text?.toLowerCase().includes('exit'))) {
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
      console.log('Executing OpenChat leave group action');

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

      // Extract group ID from text
      const groupId = parseLeaveCommand(text);

      if (!groupId) {
        throw new Error('No group ID specified. Please provide a Principal ID for the group.');
      }

      // Convert group ID to Principal
      const groupPrincipal = OpenChatUtils.createPrincipal(groupId);

      // Leave the group
      await messageHandler.leaveGroup(groupPrincipal);

      // Clean up
      await messageHandler.cleanup();

      // Create success response
      const response: Content = {
        text: `Successfully left OpenChat group ${groupId}`,
        action: 'OPENCHAT_GROUP_LEFT',
        source: message.content.source,
      };

      // Call callback if provided
      if (callback) {
        callback(response);
      }

      return response;

    } catch (error) {
      console.error('Error in leaveGroupAction:', error);
      
      const errorResponse: Content = {
        text: `Failed to leave OpenChat group: ${error.message}`,
        action: 'OPENCHAT_GROUP_LEAVE_ERROR',
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
          text: 'Leave OpenChat group rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'LEAVE_OPENCHAT_GROUP',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Successfully left OpenChat group rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'OPENCHAT_GROUP_LEFT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'openchat leave be2us-64aaa-aaaah-qaabq-cai',
          action: 'LEAVE_OPENCHAT_GROUP',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Successfully left OpenChat group be2us-64aaa-aaaah-qaabq-cai',
          action: 'OPENCHAT_GROUP_LEFT',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'Exit the OpenChat community rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'LEAVE_OPENCHAT_GROUP',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Successfully left OpenChat group rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'OPENCHAT_GROUP_LEFT',
        },
      },
    ],
  ] as ActionExample[][],
};

/**
 * Parse leave command to extract group ID
 */
function parseLeaveCommand(text: string): string | undefined {
  // Pattern 1: "Leave OpenChat group PRINCIPAL"
  let match = text.match(/leave.*?openchat.*?group\s+([a-z0-9-]+)/i);
  if (match) {
    return match[1];
  }

  // Pattern 2: "openchat leave PRINCIPAL"
  match = text.match(/openchat\s+leave\s+([a-z0-9-]+)/i);
  if (match) {
    return match[1];
  }

  // Pattern 3: "leave PRINCIPAL"
  match = text.match(/leave.*?([a-z0-9-]+)/i);
  if (match) {
    return match[1];
  }

  // Pattern 4: "exit PRINCIPAL"
  match = text.match(/exit.*?([a-z0-9-]+)/i);
  if (match) {
    return match[1];
  }

  // Pattern 5: "OpenChat community PRINCIPAL"
  match = text.match(/openchat.*?community\s+([a-z0-9-]+)/i);
  if (match) {
    return match[1];
  }

  // Pattern 6: Extract any principal-like string from leave/exit context
  const principalRegex = /([a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3})/;
  const principalMatch = text.match(principalRegex);
  if (principalMatch && 
      (text.toLowerCase().includes('leave') || text.toLowerCase().includes('exit'))) {
    return principalMatch[1];
  }

  return undefined;
}