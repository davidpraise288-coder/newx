import {
  IAgentRuntime,
  Memory,
  Provider,
  State,
} from '@elizaos/core';
import { OpenChatMessageHandler } from '../utils/message-handler.js';
import { OpenChatConfig, OpenChatMemory, OpenChatContext } from '../types/openchat.types.js';
import { OpenChatUtils } from '../utils/ic-client.js';

export const openChatProvider: Provider = {
  name: 'OPENCHAT_PROVIDER',
  description: 'Provides OpenChat context, chat history, and user information',
  
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      console.log('OpenChat provider called for message:', message.id);

      const config = runtime.getSetting('OPENCHAT_CONFIG') as OpenChatConfig;
      if (!config) {
        console.warn('OpenChat configuration not found');
        return '';
      }

      const messageHandler = new OpenChatMessageHandler({ config });
      await messageHandler.initialize();

      try {
        const context = await gatherOpenChatContext(messageHandler, message, runtime);
        await messageHandler.cleanup();
        return formatOpenChatContext(context);
      } finally {
        await messageHandler.cleanup();
      }

    } catch (error) {
      console.error('Error in OpenChat provider:', error);
      return `OpenChat provider error: ${error.message}`;
    }
  },
};

/**
 * Gather comprehensive OpenChat context
 */
async function gatherOpenChatContext(
  messageHandler: OpenChatMessageHandler,
  message: Memory,
  runtime: IAgentRuntime
): Promise<{
  currentUser: string;
  chatMemories: OpenChatMemory[];
  recentMessages: any[];
  userInfo: any;
  chatInfo: any;
}> {
  const context = {
    currentUser: '',
    chatMemories: [] as OpenChatMemory[],
    recentMessages: [] as any[],
    userInfo: null as any,
    chatInfo: null as any,
  };

  try {
    // Get current user principal
    context.currentUser = messageHandler.getCurrentUser().toString();

    // Get all chat memories
    const memories = messageHandler.getAllChatMemories();
    context.chatMemories = Array.from(memories.values());

    // If this is an OpenChat message, get specific context
    const openChatContext = message.content?.metadata?.openchat as OpenChatContext;
    if (openChatContext) {
      // Get recent messages from this chat
      context.recentMessages = await getRecentMessages(
        messageHandler,
        openChatContext
      );

      // Get chat info
      context.chatInfo = await getChatInfo(messageHandler, openChatContext);
    }

    return context;

  } catch (error) {
    console.error('Error gathering OpenChat context:', error);
    return context;
  }
}

/**
 * Get recent messages from a chat
 */
async function getRecentMessages(
  messageHandler: OpenChatMessageHandler,
  context: OpenChatContext
): Promise<any[]> {
  try {
    const client = (messageHandler as any).client;
    
    // Determine the user/chat to get messages from
    let userId = context.userId;
    
    // For group chats, we'd need a different approach
    // For now, just get direct messages
    if (context.chatId.direct) {
      userId = context.chatId.direct;
    }

    const response = await client.getMessages(userId, {
      maxMessages: 10,
      ascending: false,
    });

    if ('Success' in response) {
      return response.Success.messages.map((messageWrapper: any) => {
        if ('Message' in messageWrapper.event) {
          const msg = messageWrapper.event.Message;
          return {
            sender: msg.sender.toString(),
            content: OpenChatUtils.extractTextFromMessage(msg.content) || '[Non-text message]',
            timestamp: OpenChatUtils.timestampToDate(messageWrapper.timestamp),
            messageId: msg.message_id.toString(),
            reactions: msg.reactions,
          };
        }
        return null;
      }).filter(Boolean);
    }

    return [];

  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

/**
 * Get chat information
 */
async function getChatInfo(
  messageHandler: OpenChatMessageHandler,
  context: OpenChatContext
): Promise<any> {
  try {
    const client = (messageHandler as any).client;
    
    // Try to get chat summary
    const response = await client.getChatSummary();
    
    if ('Success' in response) {
      return {
        name: response.Success.name || 'Unknown Chat',
        description: response.Success.description || '',
        participantCount: response.Success.participant_count || 0,
        isPublic: response.Success.is_public || false,
        role: response.Success.role || { Member: null },
        permissions: response.Success.permissions || {},
        metrics: response.Success.metrics || {},
      };
    }

    return null;

  } catch (error) {
    console.error('Error getting chat info:', error);
    return null;
  }
}

/**
 * Format OpenChat context for the agent
 */
function formatOpenChatContext(context: {
  currentUser: string;
  chatMemories: OpenChatMemory[];
  recentMessages: any[];
  userInfo: any;
  chatInfo: any;
}): string {
  const parts = [];

  // Current user info
  parts.push(`Current Agent Principal: ${context.currentUser}`);

  // Chat memories summary
  if (context.chatMemories.length > 0) {
    parts.push(`\nActive Chats: ${context.chatMemories.length}`);
    
    const chatSummary = context.chatMemories.map(memory => {
      const chatKey = memory.chatId.direct ? 
        `Direct: ${memory.chatId.direct.toString()}` :
        memory.chatId.group ? 
        `Group: ${memory.chatId.group.toString()}` :
        `Community: ${memory.chatId.community?.toString()}`;
      
      return `- ${chatKey} (${memory.participantCount} participants, Role: ${Object.keys(memory.role)[0]})`;
    }).join('\n');
    
    parts.push(chatSummary);
  }

  // Chat info
  if (context.chatInfo) {
    parts.push(`\nCurrent Chat Info:`);
    parts.push(`- Name: ${context.chatInfo.name}`);
    parts.push(`- Participants: ${context.chatInfo.participantCount}`);
    parts.push(`- Public: ${context.chatInfo.isPublic ? 'Yes' : 'No'}`);
    parts.push(`- Role: ${Object.keys(context.chatInfo.role)[0]}`);
    
    if (context.chatInfo.description) {
      parts.push(`- Description: ${context.chatInfo.description}`);
    }
  }

  // Recent messages
  if (context.recentMessages.length > 0) {
    parts.push(`\nRecent Messages (${context.recentMessages.length}):`);
    
    const messageHistory = context.recentMessages
      .slice(0, 5) // Show last 5 messages
      .map((msg, index) => {
        const time = msg.timestamp ? msg.timestamp.toLocaleTimeString() : 'Unknown';
        const sender = msg.sender.substring(0, 8) + '...'; // Truncate principal for readability
        return `${index + 1}. [${time}] ${sender}: ${msg.content}`;
      })
      .join('\n');
    
    parts.push(messageHistory);
  }

  // Usage instructions
  parts.push(`\nOpenChat Commands Available:`);
  parts.push(`- Send message: "send message to [principal] saying [message]"`);
  parts.push(`- Join group: "join openchat group [principal]"`);
  parts.push(`- Leave group: "leave openchat group [principal]"`);
  parts.push(`- Get messages: "get openchat messages from [principal]"`);

  return parts.join('\n');
}

/**
 * Memory provider for OpenChat conversations
 */
export const openChatMemoryProvider: Provider = {
  name: 'OPENCHAT_MEMORY_PROVIDER',
  description: 'Provides memory context for OpenChat conversations',
  
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const openChatContext = message.content?.metadata?.openchat as OpenChatContext;
      if (!openChatContext) {
        return '';
      }

      // Get conversation history for this specific chat
      const chatKey = getChatKey(openChatContext.chatId);
      const memories = await runtime.messageManager.getMemories({
        roomId: chatKey,
        count: 10,
        unique: false,
      });

      if (memories.length === 0) {
        return 'No previous conversation history found for this chat.';
      }

      const formattedMemories = memories
        .reverse() // Show chronologically
        .map((memory, index) => {
          const timestamp = new Date(memory.createdAt).toLocaleTimeString();
          const user = memory.userId === runtime.agentId ? 'Agent' : 'User';
          const content = memory.content.text || '[Non-text content]';
          
          return `${index + 1}. [${timestamp}] ${user}: ${content}`;
        })
        .join('\n');

      return `Previous conversation in this chat:\n${formattedMemories}`;

    } catch (error) {
      console.error('Error in OpenChat memory provider:', error);
      return 'Error retrieving conversation history.';
    }
  },
};

/**
 * Get chat key for memory storage
 */
function getChatKey(chatId: any): string {
  if (chatId.direct) return `openchat-direct-${chatId.direct.toString()}`;
  if (chatId.group) return `openchat-group-${chatId.group.toString()}`;
  if (chatId.community) return `openchat-community-${chatId.community.toString()}`;
  return 'openchat-unknown';
}