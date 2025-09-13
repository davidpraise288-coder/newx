import { Principal } from '@dfinity/principal';

// Core OpenChat Types
export interface ChatId {
  community?: Principal;
  group?: Principal;
  direct?: Principal;
}

export interface UserId extends Principal {}

export interface MessageId extends bigint {}

export interface TimestampNanos extends bigint {}

// Message Content Types
export type MessageContent = 
  | { Text: { text: string } }
  | { Image: { blob_reference: BlobReference; caption?: string } }
  | { Video: { blob_reference: BlobReference; caption?: string } }
  | { Audio: { blob_reference: BlobReference; caption?: string } }
  | { File: { blob_reference: BlobReference; caption?: string } }
  | { Poll: PollContent }
  | { Crypto: CryptoContent }
  | { Deleted: { deleted_by: UserId } }
  | { Giphy: { title: string; caption?: string } }
  | { Prize: PrizeContent }
  | { PrizeWinner: PrizeWinnerContent };

export interface BlobReference {
  blob_id: bigint;
  canister_id: Principal;
}

export interface PollContent {
  votes: VoteOption[];
  config: PollConfig;
  ended: boolean;
}

export interface VoteOption {
  text: string;
  votes: number;
}

export interface PollConfig {
  allow_multiple_votes_per_user: boolean;
  text?: string;
  show_votes_before_end_date: boolean;
  end_date?: TimestampNanos;
  anonymous: boolean;
}

export interface CryptoContent {
  recipient: UserId;
  transfer: CryptoTransaction;
  caption?: string;
}

export interface CryptoTransaction {
  ledger: Principal;
  token: Cryptocurrency;
  amount: bigint;
  fee: bigint;
  memo?: bigint;
  created: TimestampNanos;
}

export interface Cryptocurrency {
  InternetComputer?: null;
  SNS1?: null;
  CKBTC?: null;
  CHAT?: null;
  KINIC?: null;
  Other?: string;
}

export interface PrizeContent {
  prizes_remaining: number;
  prizes_pending: number;
  winners: UserId[];
  token: Cryptocurrency;
  end_date: TimestampNanos;
  caption?: string;
}

export interface PrizeWinnerContent {
  winner: UserId;
  transaction: CryptoTransaction;
  prize_message: MessageId;
}

// Message Structure
export interface Message {
  message_index: number;
  message_id: MessageId;
  sender: UserId;
  content: MessageContent;
  replies_to?: ReplyContext;
  reactions: Reaction[];
  tips: Tips;
  thread_summary?: ThreadSummary;
  edited: boolean;
  forwarded: boolean;
  is_bot: boolean;
  block_level_markdown: boolean;
}

export interface ReplyContext {
  chat_id_if_other?: ChatId;
  event_index: number;
}

export interface Reaction {
  reaction: string;
  user_ids: UserId[];
}

export interface Tips {
  chat: Cryptocurrency;
  total: bigint;
}

export interface ThreadSummary {
  participant_ids: UserId[];
  reply_count: number;
  latest_event_index: number;
  latest_event_timestamp: TimestampNanos;
}

// Chat Types
export interface ChatSummary {
  chat_id: ChatId;
  kind: ChatKind;
  name: string;
  description: string;
  subtype?: GroupSubtype;
  avatar_id?: bigint;
  is_public: boolean;
  history_visible_to_new_joiners: boolean;
  min_visible_event_index: number;
  min_visible_message_index: number;
  latest_message?: MessageEventWrapper;
  latest_event_index: number;
  participant_count: number;
  role: GroupRole;
  mentions: Mention[];
  wasm_version: BuildVersion;
  permissions: GroupPermissions;
  metrics: ChatMetrics;
  my_metrics: ChatMetrics;
  latest_threads: ThreadSyncDetails[];
  archived: boolean;
  frozen: FrozenGroupInfo | null;
  date_last_pinned?: TimestampNanos;
  date_read_pinned?: TimestampNanos;
  notifications_muted: boolean;
  member_count: number;
  my_role: GroupRole;
  owner_id: UserId;
  public: boolean;
  video_call_in_progress?: VideoCall;
}

export interface ChatKind {
  Group?: null;
  DirectChat?: null;
  Channel?: null;
}

export interface GroupSubtype {
  GovernanceProposals?: {
    is_nns: boolean;
    governance_canister_id: Principal;
  };
}

export interface MessageEventWrapper {
  event: MessageEvent;
  timestamp: TimestampNanos;
  index: number;
}

export interface MessageEvent {
  Message?: Message;
  // ... other event types
}

export interface GroupRole {
  Owner?: null;
  Admin?: null;
  Moderator?: null;
  Member?: null;
  Blocked?: null;
}

export interface Mention {
  message_id: MessageId;
  message_index: number;
  mentioned_by: UserId;
  thread_root_message_index?: number;
}

export interface BuildVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface GroupPermissions {
  change_permissions: PermissionRole;
  change_roles: PermissionRole;
  add_members: PermissionRole;
  remove_members: PermissionRole;
  block_users: PermissionRole;
  delete_messages: PermissionRole;
  update_group: PermissionRole;
  pin_messages: PermissionRole;
  invite_users: PermissionRole;
  create_polls: PermissionRole;
  send_messages: PermissionRole;
  react_to_messages: PermissionRole;
  reply_in_thread: PermissionRole;
}

export interface PermissionRole {
  None?: null;
  Owner?: null;
  Admins?: null;
  Moderators?: null;
  Members?: null;
}

export interface ChatMetrics {
  text_messages: bigint;
  image_messages: bigint;
  video_messages: bigint;
  audio_messages: bigint;
  file_messages: bigint;
  polls: bigint;
  poll_votes: bigint;
  icp_messages: bigint;
  sns1_messages: bigint;
  ckbtc_messages: bigint;
  chat_messages: bigint;
  kinic_messages: bigint;
  deleted_messages: bigint;
  giphy_messages: bigint;
  prizes: bigint;
  prize_winner_messages: bigint;
  reactions: bigint;
  proposals: bigint;
  reported_messages: bigint;
  message_reminders: bigint;
  custom_type_messages: bigint;
  last_active: TimestampNanos;
}

export interface ThreadSyncDetails {
  root_message_index: number;
  last_updated: TimestampNanos;
  latest_event: number;
  latest_message: number;
}

export interface FrozenGroupInfo {
  timestamp: TimestampNanos;
  frozen_by: UserId;
  reason?: string;
}

export interface VideoCall {
  message_index: number;
  call_type: VideoCallType;
}

export interface VideoCallType {
  Broadcast?: null;
  Default?: null;
}

// API Request/Response Types
export interface SendMessageArgs {
  recipient: UserId;
  message_id: MessageId;
  content: MessageContent;
  sender_name: string;
  sender_display_name?: string;
  replies_to?: ReplyContext;
  forwarding: boolean;
  block_level_markdown?: boolean;
  correlation_id: bigint;
}

export interface SendMessageResponse {
  Success?: {
    message_index: number;
    message_id: MessageId;
    timestamp: TimestampNanos;
  };
  MessageEmpty?: null;
  TextTooLong?: number;
  RecipientBlocked?: null;
  RecipientNotFound?: null;
  InvalidRequest?: string;
  TransferSuccessV2?: CryptoTransaction;
  TransferFailed?: string;
  InternalError?: string;
}

export interface GetMessagesArgs {
  user_id: UserId;
  thread_root_message_index?: number;
  start_index: number;
  ascending: boolean;
  max_messages: number;
  max_events: number;
  invite_code?: bigint;
  latest_client_event_index?: number;
}

export interface GetMessagesResponse {
  Success?: {
    messages: MessageEventWrapper[];
    latest_event_index: number;
    timestamp: TimestampNanos;
  };
  ChatNotFound?: null;
  UserNotInChat?: null;
  ThreadMessageNotFound?: null;
  ReplicaNotUpToDate?: TimestampNanos;
}

// Plugin Configuration
export interface OpenChatConfig {
  canisterId: string;
  identity?: string; // Path to identity file or identity string
  host?: string; // IC host, defaults to https://ic0.app
  agentOptions?: {
    retryTimes?: number;
    retryDelay?: number;
  };
  polling?: {
    interval: number; // Polling interval in milliseconds
    enabled: boolean;
  };
  features?: {
    enableDirectMessages: boolean;
    enableGroupChats: boolean;
    enableCommunities: boolean;
    enableCrypto: boolean;
    enablePolls: boolean;
    enableMedia: boolean;
  };
}

// ElizaOS Integration Types
export interface OpenChatMemory {
  userId: UserId;
  chatId: ChatId;
  lastMessageIndex: number;
  lastEventIndex: number;
  participantCount: number;
  role: GroupRole;
  chatName?: string;
  chatType: 'direct' | 'group' | 'community';
}

export interface OpenChatContext {
  chatId: ChatId;
  userId: UserId;
  messageId: MessageId;
  content: MessageContent;
  timestamp: TimestampNanos;
  isThread: boolean;
  threadRootMessageIndex?: number;
  mentions: UserId[];
  reactions: Reaction[];
}

// Error Types
export interface OpenChatError {
  code: string;
  message: string;
  details?: any;
}

export enum OpenChatErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  CANISTER_ERROR = 'CANISTER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  CHAT_NOT_FOUND = 'CHAT_NOT_FOUND',
  USER_NOT_IN_CHAT = 'USER_NOT_IN_CHAT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Utility Types
export type OpenChatEventHandler = (event: MessageEventWrapper) => Promise<void>;
export type OpenChatErrorHandler = (error: OpenChatError) => void;