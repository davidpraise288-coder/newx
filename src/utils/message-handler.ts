import { EventEmitter } from 'events';
import { Principal } from '@dfinity/principal';
import { InternetComputerClient, OpenChatUtils } from './ic-client.js';
import {
  OpenChatConfig,
  OpenChatContext,
  OpenChatMemory,
  OpenChatError,
  OpenChatErrorCode,
  OpenChatEventHandler,
  OpenChatErrorHandler,
  MessageEventWrapper,
  MessageContent,
  UserId,
  ChatId,
  MessageId,
  Message,
  TimestampNanos
} from '../types/openchat.types.js';

export interface MessageHandlerOptions {
  config: OpenChatConfig;
  onMessage?: OpenChatEventHandler;
  onError?: OpenChatErrorHandler;
}

export class OpenChatMessageHandler extends EventEmitter {
  private client: InternetComputerClient;
  private config: OpenChatConfig;
  private isPolling = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastProcessedEventIndex: Map<string, number> = new Map();
  private chatMemories: Map<string, OpenChatMemory> = new Map();
  private onMessageHandler?: OpenChatEventHandler;
  private onErrorHandler?: OpenChatErrorHandler;

  constructor(options: MessageHandlerOptions) {
    super();
    this.config = options.config;
    this.client = new InternetComputerClient(options.config);
    this.onMessageHandler = options.onMessage;
    this.onErrorHandler = options.onError;
  }

  /**
   * Initialize the message handler
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing OpenChat message handler...');
      
      // Initialize IC client
      await this.client.initialize();
      
      // Start polling if enabled
      if (this.config.polling?.enabled) {
        await this.startPolling();
      }
      
      console.log('OpenChat message handler initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      const ocError = this.createError(
        OpenChatErrorCode.AUTHENTICATION_FAILED,
        'Failed to initialize message handler',
        error
      );
      this.handleError(ocError);
      throw ocError;
    }
  }

  /**
   * Start polling for new messages
   */
  async startPolling(): Promise<void> {
    if (this.isPolling) {
      console.log('Polling already active');
      return;
    }

    console.log('Starting message polling...');
    this.isPolling = true;

    const pollInterval = this.config.polling?.interval || 5000;
    
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForMessages();
      } catch (error) {
        console.error('Error during polling:', error);
        this.handleError(this.createError(
          OpenChatErrorCode.NETWORK_ERROR,
          'Polling error',
          error
        ));
      }
    }, pollInterval);

    console.log(`Polling started with ${pollInterval}ms interval`);
  }

  /**
   * Stop polling for messages
   */
  stopPolling(): void {
    if (!this.isPolling) {
      return;
    }

    console.log('Stopping message polling...');
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    console.log('Polling stopped');
  }

  /**
   * Poll for new messages from all tracked chats
   */
  private async pollForMessages(): Promise<void> {
    // For now, we'll implement a basic polling mechanism
    // In a real implementation, you'd want to track multiple chats
    
    try {
      // Get current user principal
      const currentUser = this.client.getPrincipal();
      
      // Poll for direct messages to current user
      await this.pollDirectMessages(currentUser);
      
      // Poll for group messages if any groups are tracked
      for (const [chatKey, memory] of this.chatMemories) {
        if (memory.chatType === 'group') {
          await this.pollGroupMessages(memory);
        }
      }
      
    } catch (error) {
      console.error('Error polling for messages:', error);
      throw error;
    }
  }

  /**
   * Poll for direct messages
   */
  private async pollDirectMessages(userId: UserId): Promise<void> {
    try {
      const response = await this.client.getMessages(userId, {
        startIndex: this.getLastEventIndex(userId.toString()),
        maxMessages: 50,
        ascending: true,
      });

      if ('Success' in response) {
        const messages = response.Success.messages;
        
        for (const messageWrapper of messages) {
          await this.processMessage(messageWrapper, {
            chatType: 'direct',
            userId: userId,
          });
        }
        
        // Update last processed index
        if (messages.length > 0) {
          this.setLastEventIndex(userId.toString(), response.Success.latest_event_index);
        }
      }
    } catch (error) {
      console.error('Error polling direct messages:', error);
      throw error;
    }
  }

  /**
   * Poll for group messages
   */
  private async pollGroupMessages(memory: OpenChatMemory): Promise<void> {
    try {
      // This would need to be implemented based on group chat API
      // For now, we'll skip group polling
      console.log('Group message polling not yet implemented for:', memory.chatId);
    } catch (error) {
      console.error('Error polling group messages:', error);
      throw error;
    }
  }

  /**
   * Process a single message
   */
  private async processMessage(
    messageWrapper: MessageEventWrapper,
    context: {
      chatType: 'direct' | 'group' | 'community';
      userId: UserId;
      chatId?: ChatId;
    }
  ): Promise<void> {
    try {
      // Skip if we've already processed this message
      const messageKey = `${context.userId.toString()}-${messageWrapper.index}`;
      if (this.hasProcessedMessage(messageKey)) {
        return;
      }

      // Extract message from wrapper
      if (!('Message' in messageWrapper.event)) {
        return; // Skip non-message events
      }

      const message = messageWrapper.event.Message;
      
      // Create OpenChat context
      const ocContext = this.createOpenChatContext(message, messageWrapper, context);
      
      // Update memory
      this.updateChatMemory(ocContext);
      
      // Emit message event
      this.emit('message', ocContext);
      
      // Call message handler if provided
      if (this.onMessageHandler) {
        await this.onMessageHandler(messageWrapper);
      }
      
      // Mark as processed
      this.markMessageProcessed(messageKey);
      
      console.log('Processed message:', {
        sender: message.sender.toString(),
        content: this.extractMessageText(message.content),
        timestamp: messageWrapper.timestamp,
      });
      
    } catch (error) {
      console.error('Error processing message:', error);
      this.handleError(this.createError(
        OpenChatErrorCode.INVALID_MESSAGE,
        'Failed to process message',
        error
      ));
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    recipient: UserId,
    content: string | MessageContent,
    options: {
      chatId?: ChatId;
      replyTo?: MessageId;
      senderName?: string;
      senderDisplayName?: string;
    } = {}
  ): Promise<void> {
    try {
      // Convert string content to MessageContent if needed
      const messageContent = typeof content === 'string' 
        ? OpenChatUtils.createTextMessage(content)
        : content;

      // Send message via IC client
      const response = await this.client.sendMessage(recipient, messageContent, {
        senderName: options.senderName,
        senderDisplayName: options.senderDisplayName,
      });

      if ('Success' in response) {
        console.log('Message sent successfully:', response.Success);
        this.emit('messageSent', {
          recipient,
          content: messageContent,
          messageId: response.Success.message_id,
          timestamp: response.Success.timestamp,
        });
      } else {
        throw new Error(`Failed to send message: ${JSON.stringify(response)}`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const ocError = this.createError(
        OpenChatErrorCode.CANISTER_ERROR,
        'Failed to send message',
        error
      );
      this.handleError(ocError);
      throw ocError;
    }
  }

  /**
   * Join a group chat
   */
  async joinGroup(groupId: Principal, inviteCode?: bigint): Promise<void> {
    try {
      // This would need to be implemented based on group joining API
      console.log('Joining group:', groupId.toString());
      
      // For now, just add to memory
      const chatId = OpenChatUtils.createGroupChatId(groupId);
      const memory: OpenChatMemory = {
        userId: this.client.getPrincipal(),
        chatId: chatId,
        lastMessageIndex: 0,
        lastEventIndex: 0,
        participantCount: 0,
        role: { Member: null },
        chatType: 'group',
      };
      
      this.chatMemories.set(groupId.toString(), memory);
      
      this.emit('groupJoined', { groupId, chatId });
      
    } catch (error) {
      console.error('Error joining group:', error);
      const ocError = this.createError(
        OpenChatErrorCode.CANISTER_ERROR,
        'Failed to join group',
        error
      );
      this.handleError(ocError);
      throw ocError;
    }
  }

  /**
   * Leave a group chat
   */
  async leaveGroup(groupId: Principal): Promise<void> {
    try {
      // This would need to be implemented based on group leaving API
      console.log('Leaving group:', groupId.toString());
      
      // Remove from memory
      this.chatMemories.delete(groupId.toString());
      
      this.emit('groupLeft', { groupId });
      
    } catch (error) {
      console.error('Error leaving group:', error);
      const ocError = this.createError(
        OpenChatErrorCode.CANISTER_ERROR,
        'Failed to leave group',
        error
      );
      this.handleError(ocError);
      throw ocError;
    }
  }

  /**
   * Get chat memory for a specific chat
   */
  getChatMemory(chatKey: string): OpenChatMemory | undefined {
    return this.chatMemories.get(chatKey);
  }

  /**
   * Get all chat memories
   */
  getAllChatMemories(): Map<string, OpenChatMemory> {
    return new Map(this.chatMemories);
  }

  /**
   * Create OpenChat context from message
   */
  private createOpenChatContext(
    message: Message,
    wrapper: MessageEventWrapper,
    context: {
      chatType: 'direct' | 'group' | 'community';
      userId: UserId;
      chatId?: ChatId;
    }
  ): OpenChatContext {
    return {
      chatId: context.chatId || OpenChatUtils.createDirectChatId(context.userId),
      userId: message.sender,
      messageId: message.message_id,
      content: message.content,
      timestamp: wrapper.timestamp,
      isThread: !!message.thread_summary,
      threadRootMessageIndex: message.replies_to?.event_index,
      mentions: [], // Would need to extract from message
      reactions: message.reactions,
    };
  }

  /**
   * Update chat memory
   */
  private updateChatMemory(context: OpenChatContext): void {
    const chatKey = this.getChatKey(context.chatId);
    
    let memory = this.chatMemories.get(chatKey);
    if (!memory) {
      memory = {
        userId: context.userId,
        chatId: context.chatId,
        lastMessageIndex: 0,
        lastEventIndex: 0,
        participantCount: 1,
        role: { Member: null },
        chatType: 'direct', // Default, would be determined from chatId
      };
    }

    // Update with latest information
    memory.lastMessageIndex = Math.max(memory.lastMessageIndex, Number(context.messageId));
    
    this.chatMemories.set(chatKey, memory);
  }

  /**
   * Extract text from message content
   */
  private extractMessageText(content: MessageContent): string {
    return OpenChatUtils.extractTextFromMessage(content) || '[Non-text message]';
  }

  /**
   * Get chat key for memory storage
   */
  private getChatKey(chatId: ChatId): string {
    if (chatId.direct) return `direct-${chatId.direct.toString()}`;
    if (chatId.group) return `group-${chatId.group.toString()}`;
    if (chatId.community) return `community-${chatId.community.toString()}`;
    return 'unknown';
  }

  /**
   * Get last processed event index for a chat
   */
  private getLastEventIndex(chatKey: string): number {
    return this.lastProcessedEventIndex.get(chatKey) || 0;
  }

  /**
   * Set last processed event index for a chat
   */
  private setLastEventIndex(chatKey: string, index: number): void {
    this.lastProcessedEventIndex.set(chatKey, index);
  }

  /**
   * Check if message has been processed
   */
  private hasProcessedMessage(messageKey: string): boolean {
    // Simple in-memory tracking - in production you'd want persistent storage
    return this.lastProcessedEventIndex.has(messageKey);
  }

  /**
   * Mark message as processed
   */
  private markMessageProcessed(messageKey: string): void {
    this.lastProcessedEventIndex.set(messageKey, Date.now());
  }

  /**
   * Handle errors
   */
  private handleError(error: OpenChatError): void {
    console.error('OpenChat error:', error);
    this.emit('error', error);
    
    if (this.onErrorHandler) {
      this.onErrorHandler(error);
    }
  }

  /**
   * Create standardized error
   */
  private createError(code: OpenChatErrorCode, message: string, details?: any): OpenChatError {
    return {
      code,
      message,
      details,
    };
  }

  /**
   * Get current user principal
   */
  getCurrentUser(): Principal {
    return this.client.getPrincipal();
  }

  /**
   * Check if handler is ready
   */
  isReady(): boolean {
    return this.client.isReady();
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up message handler...');
    
    this.stopPolling();
    await this.client.cleanup();
    
    this.chatMemories.clear();
    this.lastProcessedEventIndex.clear();
    
    this.emit('cleanup');
    console.log('Message handler cleanup complete');
  }
}