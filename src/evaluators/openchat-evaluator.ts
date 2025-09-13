import {
  Evaluator,
  IAgentRuntime,
  Memory,
  State,
} from '@elizaos/core';
import { OpenChatContext, OpenChatConfig } from '../types/openchat.types.js';
import { OpenChatUtils } from '../utils/ic-client.js';

export const openChatEvaluator: Evaluator = {
  name: 'OPENCHAT_MESSAGE_EVALUATOR',
  similes: [
    'OPENCHAT_EVALUATOR',
    'OPENCHAT_MESSAGE',
    'OPENCHAT_CONTEXT',
  ],
  description: 'Evaluates OpenChat messages and context for agent responses',
  
  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Check if this is an OpenChat message
    if (message.content?.source === 'openchat') {
      return true;
    }

    // Check if message contains OpenChat context
    if (message.content?.metadata?.openchat) {
      return true;
    }

    // Check if message mentions OpenChat
    const text = message.content?.text?.toLowerCase() || '';
    if (text.includes('openchat')) {
      return true;
    }

    return false;
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      console.log('Evaluating OpenChat message:', message.id);

      const evaluation = {
        isOpenChatMessage: false,
        chatType: null as 'direct' | 'group' | 'community' | null,
        sender: null as string | null,
        recipient: null as string | null,
        messageType: null as string | null,
        hasAttachments: false,
        isReply: false,
        mentions: [] as string[],
        reactions: [] as any[],
        confidence: 0,
        shouldRespond: false,
        context: null as OpenChatContext | null,
      };

      // Extract OpenChat context if available
      const openChatContext = message.content?.metadata?.openchat as OpenChatContext;
      if (openChatContext) {
        evaluation.isOpenChatMessage = true;
        evaluation.context = openChatContext;
        evaluation.sender = openChatContext.userId.toString();
        evaluation.confidence = 1.0;

        // Determine chat type
        if (openChatContext.chatId.direct) {
          evaluation.chatType = 'direct';
        } else if (openChatContext.chatId.group) {
          evaluation.chatType = 'group';
        } else if (openChatContext.chatId.community) {
          evaluation.chatType = 'community';
        }

        // Check message type
        if (OpenChatUtils.isTextMessage(openChatContext.content)) {
          evaluation.messageType = 'text';
        } else {
          evaluation.messageType = 'media';
          evaluation.hasAttachments = true;
        }

        // Check if it's a reply
        evaluation.isReply = evaluation.context.isThread;

        // Extract mentions and reactions
        evaluation.mentions = openChatContext.mentions?.map(m => m.toString()) || [];
        evaluation.reactions = openChatContext.reactions || [];

        // Determine if agent should respond
        evaluation.shouldRespond = await shouldAgentRespond(
          runtime,
          openChatContext,
          evaluation
        );
      }

      // Check for OpenChat-related keywords in text
      const text = message.content?.text?.toLowerCase() || '';
      if (text.includes('openchat')) {
        evaluation.confidence = Math.max(evaluation.confidence, 0.8);
        
        if (text.includes('send') || text.includes('message')) {
          evaluation.shouldRespond = true;
        }
      }

      console.log('OpenChat evaluation result:', evaluation);

      return evaluation;

    } catch (error) {
      console.error('Error in OpenChat evaluator:', error);
      return {
        isOpenChatMessage: false,
        confidence: 0,
        shouldRespond: false,
        error: error.message,
      };
    }
  },

  examples: [
    {
      context: 'User sends a direct message on OpenChat',
      messages: [
        {
          user: '{{user1}}',
          content: {
            text: 'Hello, how are you?',
            source: 'openchat',
            metadata: {
              openchat: {
                chatId: { direct: 'rdmx6-jaaaa-aaaah-qacaa-cai' },
                userId: 'be2us-64aaa-aaaah-qaabq-cai',
                messageId: BigInt(12345),
                content: { Text: { text: 'Hello, how are you?' } },
                timestamp: BigInt(Date.now() * 1000000),
                isThread: false,
                mentions: [],
                reactions: [],
              },
            },
          },
        },
      ],
      outcome: 'Agent recognizes OpenChat direct message and prepares response',
    },
    {
      context: 'User mentions agent in group chat',
      messages: [
        {
          user: '{{user1}}',
          content: {
            text: '@agent can you help with this?',
            source: 'openchat',
            metadata: {
              openchat: {
                chatId: { group: 'rdmx6-jaaaa-aaaah-qacaa-cai' },
                userId: 'be2us-64aaa-aaaah-qaabq-cai',
                messageId: BigInt(12346),
                content: { Text: { text: '@agent can you help with this?' } },
                timestamp: BigInt(Date.now() * 1000000),
                isThread: false,
                mentions: ['current-agent-principal'],
                reactions: [],
              },
            },
          },
        },
      ],
      outcome: 'Agent detects mention in group chat and decides to respond',
    },
  ],
};

/**
 * Determine if the agent should respond to an OpenChat message
 */
async function shouldAgentRespond(
  runtime: IAgentRuntime,
  context: OpenChatContext,
  evaluation: any
): Promise<boolean> {
  try {
    const agentPrincipal = runtime.getSetting('OPENCHAT_AGENT_PRINCIPAL') || '';
    
    // Always respond to direct messages
    if (evaluation.chatType === 'direct') {
      return true;
    }

    // Respond if agent is mentioned
    if (evaluation.mentions.includes(agentPrincipal)) {
      return true;
    }

    // Respond to replies to agent's messages
    if (evaluation.isReply && context.threadRootMessageIndex) {
      // Would need to check if the root message was from the agent
      // For now, assume we should respond to replies
      return true;
    }

    // Check for trigger words in group chats
    const text = OpenChatUtils.extractTextFromMessage(context.content)?.toLowerCase() || '';
    const triggerWords = [
      'help',
      'question',
      'agent',
      'bot',
      runtime.character?.name?.toLowerCase(),
    ].filter(Boolean);

    if (triggerWords.some(word => text.includes(word))) {
      return true;
    }

    // Don't respond to group messages by default
    return false;

  } catch (error) {
    console.error('Error determining response necessity:', error);
    return false;
  }
}