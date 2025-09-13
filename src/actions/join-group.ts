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

export const joinGroupAction: Action = {
  name: 'JOIN_OPENCHAT_GROUP',
  similes: [
    'OPENCHAT_JOIN_GROUP',
    'JOIN_GROUP_OPENCHAT',
    'OPENCHAT_JOIN',
    'JOIN_OPENCHAT',
    'OPENCHAT_GROUP_JOIN',
  ],
  description: 'Join an OpenChat group or community',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as Content;
    
    // Check if this is a join group request
    if (content.text?.toLowerCase().includes('join') &&
        (content.text?.toLowerCase().includes('openchat') ||
         content.text?.toLowerCase().includes('group') ||
         content.text?.toLowerCase().includes('community'))) {
      return true;
    }

    if (content.action === 'JOIN_OPENCHAT_GROUP') {
      return true;
    }

    // Check if text contains a Principal ID and join keyword
    const principalRegex = /[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}/;
    if (principalRegex.test(content.text || '') && 
        content.text?.toLowerCase().includes('join')) {
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
      console.log('Executing OpenChat join group action');

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

      // Extract group ID and invite code from text
      const { groupId, inviteCode } = parseJoinCommand(text);

      if (!groupId) {
        throw new Error('No group ID specified. Please provide a Principal ID for the group.');
      }

      // Convert group ID to Principal
      const groupPrincipal = OpenChatUtils.createPrincipal(groupId);

      // Join the group
      await messageHandler.joinGroup(groupPrincipal, inviteCode);

      // Clean up
      await messageHandler.cleanup();

      // Create success response
      const response: Content = {
        text: `Successfully joined OpenChat group ${groupId}`,
        action: 'OPENCHAT_GROUP_JOINED',
        source: message.content.source,
      };

      // Call callback if provided
      if (callback) {
        callback(response);
      }

      return response;

    } catch (error) {
      console.error('Error in joinGroupAction:', error);
      
      const errorResponse: Content = {
        text: `Failed to join OpenChat group: ${error.message}`,
        action: 'OPENCHAT_GROUP_JOIN_ERROR',
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
          text: 'Join OpenChat group rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'JOIN_OPENCHAT_GROUP',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Successfully joined OpenChat group rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'OPENCHAT_GROUP_JOINED',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'openchat join be2us-64aaa-aaaah-qaabq-cai with invite code 12345',
          action: 'JOIN_OPENCHAT_GROUP',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Successfully joined OpenChat group be2us-64aaa-aaaah-qaabq-cai',
          action: 'OPENCHAT_GROUP_JOINED',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: {
          text: 'I want to join the OpenChat community at rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'JOIN_OPENCHAT_GROUP',
        },
      },
      {
        user: '{{user2}}',
        content: {
          text: 'Successfully joined OpenChat group rdmx6-jaaaa-aaaah-qacaa-cai',
          action: 'OPENCHAT_GROUP_JOINED',
        },
      },
    ],
  ] as ActionExample[][],
};

/**
 * Parse join command to extract group ID and invite code
 */
function parseJoinCommand(text: string): { groupId?: string; inviteCode?: bigint } {
  // Pattern 1: "Join OpenChat group PRINCIPAL"
  let match = text.match(/join.*?openchat.*?group\s+([a-z0-9-]+)/i);
  if (match) {
    return { groupId: match[1] };
  }

  // Pattern 2: "openchat join PRINCIPAL with invite code NUMBER"
  match = text.match(/openchat\s+join\s+([a-z0-9-]+).*?invite.*?code\s+(\d+)/i);
  if (match) {
    return { 
      groupId: match[1], 
      inviteCode: BigInt(match[2])
    };
  }

  // Pattern 3: "join PRINCIPAL"
  match = text.match(/join.*?([a-z0-9-]+)/i);
  if (match) {
    return { groupId: match[1] };
  }

  // Pattern 4: "OpenChat community at PRINCIPAL"
  match = text.match(/openchat.*?community.*?at\s+([a-z0-9-]+)/i);
  if (match) {
    return { groupId: match[1] };
  }

  // Pattern 5: Extract any principal-like string from join context
  const principalRegex = /([a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3})/;
  const principalMatch = text.match(principalRegex);
  if (principalMatch && text.toLowerCase().includes('join')) {
    const groupId = principalMatch[1];
    
    // Look for invite code
    const inviteMatch = text.match(/invite.*?code\s+(\d+)/i);
    const inviteCode = inviteMatch ? BigInt(inviteMatch[1]) : undefined;
    
    return { groupId, inviteCode };
  }

  return {};
}