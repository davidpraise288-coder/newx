// OpenChat Candid Interface Definition
// This would normally be generated from the actual .did file
// For now, we'll create a basic structure

import { IDL } from '@dfinity/candid';

// Basic types
const UserId = IDL.Principal;
const ChatId = IDL.Variant({
  'community': IDL.Principal,
  'group': IDL.Principal,
  'direct': IDL.Principal,
});

const MessageId = IDL.Nat;
const TimestampNanos = IDL.Nat64;

const MessageContent = IDL.Variant({
  'Text': IDL.Record({ 'text': IDL.Text }),
  'Image': IDL.Record({
    'blob_reference': IDL.Record({
      'blob_id': IDL.Nat,
      'canister_id': IDL.Principal,
    }),
    'caption': IDL.Opt(IDL.Text),
  }),
  'Video': IDL.Record({
    'blob_reference': IDL.Record({
      'blob_id': IDL.Nat,
      'canister_id': IDL.Principal,
    }),
    'caption': IDL.Opt(IDL.Text),
  }),
  'Audio': IDL.Record({
    'blob_reference': IDL.Record({
      'blob_id': IDL.Nat,
      'canister_id': IDL.Principal,
    }),
    'caption': IDL.Opt(IDL.Text),
  }),
  'File': IDL.Record({
    'blob_reference': IDL.Record({
      'blob_id': IDL.Nat,
      'canister_id': IDL.Principal,
    }),
    'caption': IDL.Opt(IDL.Text),
  }),
  'Deleted': IDL.Record({ 'deleted_by': UserId }),
  'Crypto': IDL.Record({
    'recipient': UserId,
    'transfer': IDL.Record({
      'ledger': IDL.Principal,
      'token': IDL.Variant({
        'InternetComputer': IDL.Null,
        'SNS1': IDL.Null,
        'CKBTC': IDL.Null,
        'CHAT': IDL.Null,
        'KINIC': IDL.Null,
        'Other': IDL.Text,
      }),
      'amount': IDL.Nat,
      'fee': IDL.Nat,
      'memo': IDL.Opt(IDL.Nat64),
      'created': TimestampNanos,
    }),
    'caption': IDL.Opt(IDL.Text),
  }),
});

const Message = IDL.Record({
  'message_index': IDL.Nat32,
  'message_id': MessageId,
  'sender': UserId,
  'content': MessageContent,
  'replies_to': IDL.Opt(IDL.Record({
    'chat_id_if_other': IDL.Opt(ChatId),
    'event_index': IDL.Nat32,
  })),
  'reactions': IDL.Vec(IDL.Record({
    'reaction': IDL.Text,
    'user_ids': IDL.Vec(UserId),
  })),
  'tips': IDL.Record({
    'chat': IDL.Variant({
      'InternetComputer': IDL.Null,
      'SNS1': IDL.Null,
      'CKBTC': IDL.Null,
      'CHAT': IDL.Null,
      'KINIC': IDL.Null,
      'Other': IDL.Text,
    }),
    'total': IDL.Nat,
  }),
  'thread_summary': IDL.Opt(IDL.Record({
    'participant_ids': IDL.Vec(UserId),
    'reply_count': IDL.Nat32,
    'latest_event_index': IDL.Nat32,
    'latest_event_timestamp': TimestampNanos,
  })),
  'edited': IDL.Bool,
  'forwarded': IDL.Bool,
  'is_bot': IDL.Bool,
  'block_level_markdown': IDL.Bool,
});

const MessageEvent = IDL.Variant({
  'Message': Message,
});

const MessageEventWrapper = IDL.Record({
  'event': MessageEvent,
  'timestamp': TimestampNanos,
  'index': IDL.Nat32,
});

// API Methods
const SendMessageArgs = IDL.Record({
  'recipient': UserId,
  'message_id': MessageId,
  'content': MessageContent,
  'sender_name': IDL.Text,
  'sender_display_name': IDL.Opt(IDL.Text),
  'replies_to': IDL.Opt(IDL.Record({
    'chat_id_if_other': IDL.Opt(ChatId),
    'event_index': IDL.Nat32,
  })),
  'forwarding': IDL.Bool,
  'block_level_markdown': IDL.Opt(IDL.Bool),
  'correlation_id': IDL.Nat64,
});

const SendMessageResponse = IDL.Variant({
  'Success': IDL.Record({
    'message_index': IDL.Nat32,
    'message_id': MessageId,
    'timestamp': TimestampNanos,
  }),
  'MessageEmpty': IDL.Null,
  'TextTooLong': IDL.Nat32,
  'RecipientBlocked': IDL.Null,
  'RecipientNotFound': IDL.Null,
  'InvalidRequest': IDL.Text,
  'TransferSuccessV2': IDL.Record({
    'ledger': IDL.Principal,
    'token': IDL.Variant({
      'InternetComputer': IDL.Null,
      'SNS1': IDL.Null,
      'CKBTC': IDL.Null,
      'CHAT': IDL.Null,
      'KINIC': IDL.Null,
      'Other': IDL.Text,
    }),
    'amount': IDL.Nat,
    'fee': IDL.Nat,
    'memo': IDL.Opt(IDL.Nat64),
    'created': TimestampNanos,
  }),
  'TransferFailed': IDL.Text,
  'InternalError': IDL.Text,
});

const GetMessagesArgs = IDL.Record({
  'user_id': UserId,
  'thread_root_message_index': IDL.Opt(IDL.Nat32),
  'start_index': IDL.Nat32,
  'ascending': IDL.Bool,
  'max_messages': IDL.Nat32,
  'max_events': IDL.Nat32,
  'invite_code': IDL.Opt(IDL.Nat64),
  'latest_client_event_index': IDL.Opt(IDL.Nat32),
});

const GetMessagesResponse = IDL.Variant({
  'Success': IDL.Record({
    'messages': IDL.Vec(MessageEventWrapper),
    'latest_event_index': IDL.Nat32,
    'timestamp': TimestampNanos,
  }),
  'ChatNotFound': IDL.Null,
  'UserNotInChat': IDL.Null,
  'ThreadMessageNotFound': IDL.Null,
  'ReplicaNotUpToDate': TimestampNanos,
});

// Service interface
export const idlFactory = ({ IDL }: { IDL: any }) => {
  return IDL.Service({
    'send_message_v2': IDL.Func([SendMessageArgs], [SendMessageResponse], []),
    'messages': IDL.Func([GetMessagesArgs], [GetMessagesResponse], ['query']),
    'messages_by_message_index': IDL.Func(
      [IDL.Record({
        'user_id': UserId,
        'messages': IDL.Vec(IDL.Nat32),
        'thread_root_message_index': IDL.Opt(IDL.Nat32),
        'latest_client_event_index': IDL.Opt(IDL.Nat32),
      })],
      [IDL.Variant({
        'Success': IDL.Record({
          'messages': IDL.Vec(MessageEventWrapper),
          'latest_event_index': IDL.Nat32,
          'timestamp': TimestampNanos,
        }),
        'ChatNotFound': IDL.Null,
        'UserNotInChat': IDL.Null,
        'ThreadMessageNotFound': IDL.Null,
        'ReplicaNotUpToDate': TimestampNanos,
      })],
      ['query']
    ),
    'events': IDL.Func(
      [IDL.Record({
        'user_id': UserId,
        'thread_root_message_index': IDL.Opt(IDL.Nat32),
        'start_index': IDL.Nat32,
        'ascending': IDL.Bool,
        'max_events': IDL.Nat32,
        'latest_client_event_index': IDL.Opt(IDL.Nat32),
      })],
      [IDL.Variant({
        'Success': IDL.Record({
          'events': IDL.Vec(MessageEventWrapper),
          'latest_event_index': IDL.Nat32,
          'timestamp': TimestampNanos,
        }),
        'ChatNotFound': IDL.Null,
        'UserNotInChat': IDL.Null,
        'ThreadMessageNotFound': IDL.Null,
        'ReplicaNotUpToDate': TimestampNanos,
      })],
      ['query']
    ),
    'summary': IDL.Func(
      [],
      [IDL.Variant({
        'Success': IDL.Record({
          'participant_count': IDL.Nat32,
          'is_public': IDL.Bool,
          'video_call_in_progress': IDL.Opt(IDL.Record({
            'message_index': IDL.Nat32,
            'call_type': IDL.Variant({
              'Broadcast': IDL.Null,
              'Default': IDL.Null,
            }),
          })),
          'metrics': IDL.Record({
            'text_messages': IDL.Nat64,
            'image_messages': IDL.Nat64,
            'video_messages': IDL.Nat64,
            'audio_messages': IDL.Nat64,
            'file_messages': IDL.Nat64,
            'polls': IDL.Nat64,
            'poll_votes': IDL.Nat64,
            'icp_messages': IDL.Nat64,
            'sns1_messages': IDL.Nat64,
            'ckbtc_messages': IDL.Nat64,
            'chat_messages': IDL.Nat64,
            'kinic_messages': IDL.Nat64,
            'deleted_messages': IDL.Nat64,
            'giphy_messages': IDL.Nat64,
            'prizes': IDL.Nat64,
            'prize_winner_messages': IDL.Nat64,
            'reactions': IDL.Nat64,
            'proposals': IDL.Nat64,
            'reported_messages': IDL.Nat64,
            'message_reminders': IDL.Nat64,
            'custom_type_messages': IDL.Nat64,
            'last_active': TimestampNanos,
          }),
          'subtype': IDL.Opt(IDL.Variant({
            'GovernanceProposals': IDL.Record({
              'is_nns': IDL.Bool,
              'governance_canister_id': IDL.Principal,
            }),
          })),
          'permissions': IDL.Record({
            'change_permissions': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'change_roles': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'add_members': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'remove_members': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'block_users': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'delete_messages': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'update_group': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'pin_messages': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'invite_users': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'create_polls': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'send_messages': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'react_to_messages': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
            'reply_in_thread': IDL.Variant({
              'None': IDL.Null,
              'Owner': IDL.Null,
              'Admins': IDL.Null,
              'Moderators': IDL.Null,
              'Members': IDL.Null,
            }),
          }),
          'name': IDL.Text,
          'role': IDL.Variant({
            'Owner': IDL.Null,
            'Admin': IDL.Null,
            'Moderator': IDL.Null,
            'Member': IDL.Null,
            'Blocked': IDL.Null,
          }),
          'wasm_version': IDL.Record({
            'major': IDL.Nat32,
            'minor': IDL.Nat32,
            'patch': IDL.Nat32,
          }),
          'avatar_id': IDL.Opt(IDL.Nat),
          'history_visible_to_new_joiners': IDL.Bool,
          'min_visible_event_index': IDL.Nat32,
          'min_visible_message_index': IDL.Nat32,
          'latest_message': IDL.Opt(MessageEventWrapper),
          'latest_event_index': IDL.Nat32,
          'joined': TimestampNanos,
          'latest_threads': IDL.Vec(IDL.Record({
            'root_message_index': IDL.Nat32,
            'last_updated': TimestampNanos,
            'latest_event': IDL.Nat32,
            'latest_message': IDL.Nat32,
          })),
          'frozen': IDL.Opt(IDL.Record({
            'timestamp': TimestampNanos,
            'frozen_by': UserId,
            'reason': IDL.Opt(IDL.Text),
          })),
          'notifications_muted': IDL.Bool,
          'description': IDL.Text,
        }),
        'ChatNotFound': IDL.Null,
        'UserNotInChat': IDL.Null,
      })],
      ['query']
    ),
  });
};

export const init = ({ IDL }: { IDL: any }) => {
  return [];
};