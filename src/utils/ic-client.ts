import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { idlFactory } from '../candid/openchat.did.js';
import { 
  OpenChatConfig, 
  OpenChatError, 
  OpenChatErrorCode,
  SendMessageArgs,
  SendMessageResponse,
  GetMessagesArgs,
  GetMessagesResponse,
  MessageEventWrapper,
  UserId,
  ChatId,
  MessageContent,
  MessageId
} from '../types/openchat.types.js';
import * as fs from 'fs';
import * as crypto from 'crypto';

export class InternetComputerClient {
  private agent: HttpAgent | null = null;
  private actor: any = null;
  private identity: Identity | null = null;
  private config: OpenChatConfig;
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(config: OpenChatConfig) {
    this.config = {
      host: 'https://ic0.app',
      agentOptions: {
        retryTimes: 3,
        retryDelay: 1000,
      },
      polling: {
        interval: 5000,
        enabled: true,
      },
      features: {
        enableDirectMessages: true,
        enableGroupChats: true,
        enableCommunities: false,
        enableCrypto: false,
        enablePolls: true,
        enableMedia: true,
      },
      ...config,
    };
  }

  /**
   * Initialize the IC client with authentication
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Internet Computer client...');
      
      // Set up identity
      await this.setupIdentity();
      
      // Create HTTP agent
      this.agent = new HttpAgent({
        host: this.config.host,
        identity: this.identity,
      });

      // Fetch root key for local development
      if (this.config.host?.includes('localhost') || this.config.host?.includes('127.0.0.1')) {
        await this.agent.fetchRootKey();
        console.log('Fetched root key for local development');
      }

      // Create actor
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: this.config.canisterId,
      });

      this.isInitialized = true;
      console.log('IC client initialized successfully');
      
      // Test connection
      await this.testConnection();
      
    } catch (error) {
      console.error('Failed to initialize IC client:', error);
      throw this.createError(OpenChatErrorCode.AUTHENTICATION_FAILED, 'Failed to initialize IC client', error);
    }
  }

  /**
   * Set up identity for authentication
   */
  private async setupIdentity(): Promise<void> {
    if (this.config.identity) {
      // Try to load identity from file or string
      try {
        if (fs.existsSync(this.config.identity)) {
          // Load from file
          const identityData = fs.readFileSync(this.config.identity, 'utf8');
          const keyPair = JSON.parse(identityData);
          this.identity = Ed25519KeyIdentity.fromKeyPair(
            new Uint8Array(keyPair.publicKey),
            new Uint8Array(keyPair.privateKey)
          );
          console.log('Loaded identity from file');
        } else {
          // Try to parse as JSON string
          const keyPair = JSON.parse(this.config.identity);
          this.identity = Ed25519KeyIdentity.fromKeyPair(
            new Uint8Array(keyPair.publicKey),
            new Uint8Array(keyPair.privateKey)
          );
          console.log('Loaded identity from string');
        }
      } catch (error) {
        console.warn('Failed to load provided identity, generating new one:', error);
        this.identity = this.generateIdentity();
      }
    } else {
      // Generate new identity
      this.identity = this.generateIdentity();
    }

    console.log('Identity Principal:', this.identity.getPrincipal().toString());
  }

  /**
   * Generate a new Ed25519 identity
   */
  private generateIdentity(): Ed25519KeyIdentity {
    const seed = crypto.randomBytes(32);
    const identity = Ed25519KeyIdentity.generate(seed);
    
    // Save identity for reuse
    const keyPair = {
      publicKey: Array.from(identity.getPublicKey().toDer()),
      privateKey: Array.from(identity.getKeyPair().secretKey),
    };
    
    const identityPath = './openchat-identity.json';
    fs.writeFileSync(identityPath, JSON.stringify(keyPair, null, 2));
    console.log('Generated new identity and saved to:', identityPath);
    
    return identity;
  }

  /**
   * Test connection to OpenChat canister
   */
  private async testConnection(): Promise<void> {
    try {
      // Try to call a simple query method
      const result = await this.actor.summary();
      console.log('Connection test successful:', result);
    } catch (error) {
      console.warn('Connection test failed, but continuing:', error);
      // Don't throw here as some methods might not be available without proper setup
    }
  }

  /**
   * Send a message to OpenChat
   */
  async sendMessage(
    recipient: UserId,
    content: MessageContent,
    options: {
      messageId?: MessageId;
      senderName?: string;
      senderDisplayName?: string;
      repliesTo?: any;
      forwarding?: boolean;
      blockLevelMarkdown?: boolean;
    } = {}
  ): Promise<SendMessageResponse> {
    this.ensureInitialized();

    const args: SendMessageArgs = {
      recipient,
      message_id: options.messageId || BigInt(Date.now() * 1000000), // Use timestamp as message ID
      content,
      sender_name: options.senderName || 'ElizaOS Agent',
      sender_display_name: options.senderDisplayName,
      replies_to: options.repliesTo,
      forwarding: options.forwarding || false,
      block_level_markdown: options.blockLevelMarkdown,
      correlation_id: BigInt(Date.now()),
    };

    return await this.retryOperation(async () => {
      console.log('Sending message to:', recipient.toString());
      const response = await this.actor.send_message_v2(args);
      console.log('Message sent successfully:', response);
      return response;
    });
  }

  /**
   * Get messages from a chat
   */
  async getMessages(
    userId: UserId,
    options: {
      threadRootMessageIndex?: number;
      startIndex?: number;
      ascending?: boolean;
      maxMessages?: number;
      maxEvents?: number;
      inviteCode?: bigint;
      latestClientEventIndex?: number;
    } = {}
  ): Promise<GetMessagesResponse> {
    this.ensureInitialized();

    const args: GetMessagesArgs = {
      user_id: userId,
      thread_root_message_index: options.threadRootMessageIndex,
      start_index: options.startIndex || 0,
      ascending: options.ascending || false,
      max_messages: options.maxMessages || 100,
      max_events: options.maxEvents || 1000,
      invite_code: options.inviteCode,
      latest_client_event_index: options.latestClientEventIndex,
    };

    return await this.retryOperation(async () => {
      console.log('Getting messages for user:', userId.toString());
      const response = await this.actor.messages(args);
      console.log('Retrieved messages:', response);
      return response;
    });
  }

  /**
   * Get messages by message indices
   */
  async getMessagesByIndex(
    userId: UserId,
    messageIndices: number[],
    options: {
      threadRootMessageIndex?: number;
      latestClientEventIndex?: number;
    } = {}
  ): Promise<any> {
    this.ensureInitialized();

    const args = {
      user_id: userId,
      messages: messageIndices,
      thread_root_message_index: options.threadRootMessageIndex,
      latest_client_event_index: options.latestClientEventIndex,
    };

    return await this.retryOperation(async () => {
      console.log('Getting messages by index for user:', userId.toString());
      const response = await this.actor.messages_by_message_index(args);
      console.log('Retrieved messages by index:', response);
      return response;
    });
  }

  /**
   * Get events from a chat
   */
  async getEvents(
    userId: UserId,
    options: {
      threadRootMessageIndex?: number;
      startIndex?: number;
      ascending?: boolean;
      maxEvents?: number;
      latestClientEventIndex?: number;
    } = {}
  ): Promise<any> {
    this.ensureInitialized();

    const args = {
      user_id: userId,
      thread_root_message_index: options.threadRootMessageIndex,
      start_index: options.startIndex || 0,
      ascending: options.ascending || false,
      max_events: options.maxEvents || 1000,
      latest_client_event_index: options.latestClientEventIndex,
    };

    return await this.retryOperation(async () => {
      console.log('Getting events for user:', userId.toString());
      const response = await this.actor.events(args);
      console.log('Retrieved events:', response);
      return response;
    });
  }

  /**
   * Get chat summary
   */
  async getChatSummary(): Promise<any> {
    this.ensureInitialized();

    return await this.retryOperation(async () => {
      console.log('Getting chat summary');
      const response = await this.actor.summary();
      console.log('Retrieved chat summary:', response);
      return response;
    });
  }

  /**
   * Get current user's principal
   */
  getPrincipal(): Principal {
    if (!this.identity) {
      throw this.createError(OpenChatErrorCode.AUTHENTICATION_FAILED, 'Identity not initialized');
    }
    return this.identity.getPrincipal();
  }

  /**
   * Check if client is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.agent !== null && this.actor !== null;
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Operation failed (attempt ${attempt + 1}/${this.maxRetries + 1}):`, error);
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * (this.config.agentOptions?.retryDelay || 1000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw this.createError(
      OpenChatErrorCode.CANISTER_ERROR,
      `Operation failed after ${this.maxRetries + 1} attempts`,
      lastError
    );
  }

  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw this.createError(OpenChatErrorCode.AUTHENTICATION_FAILED, 'Client not initialized. Call initialize() first.');
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
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up IC client resources...');
    this.isInitialized = false;
    this.actor = null;
    this.agent = null;
    // Note: We don't clear identity as it might be reused
  }
}

/**
 * Utility functions for working with OpenChat types
 */
export class OpenChatUtils {
  /**
   * Create a text message content
   */
  static createTextMessage(text: string): MessageContent {
    return { Text: { text } };
  }

  /**
   * Create a Principal from string
   */
  static createPrincipal(principalString: string): Principal {
    return Principal.fromText(principalString);
  }

  /**
   * Create a direct chat ID
   */
  static createDirectChatId(principal: Principal): ChatId {
    return { direct: principal };
  }

  /**
   * Create a group chat ID
   */
  static createGroupChatId(principal: Principal): ChatId {
    return { group: principal };
  }

  /**
   * Create a community chat ID
   */
  static createCommunityChatId(principal: Principal): ChatId {
    return { community: principal };
  }

  /**
   * Extract text from message content
   */
  static extractTextFromMessage(content: MessageContent): string | null {
    if ('Text' in content) {
      return content.Text.text;
    }
    return null;
  }

  /**
   * Check if message content is text
   */
  static isTextMessage(content: MessageContent): boolean {
    return 'Text' in content;
  }

  /**
   * Generate a unique message ID
   */
  static generateMessageId(): MessageId {
    return BigInt(Date.now() * 1000000 + Math.floor(Math.random() * 1000000));
  }

  /**
   * Convert timestamp to Date
   */
  static timestampToDate(timestamp: bigint): Date {
    return new Date(Number(timestamp / BigInt(1000000)));
  }

  /**
   * Convert Date to timestamp
   */
  static dateToTimestamp(date: Date): bigint {
    return BigInt(date.getTime() * 1000000);
  }
}