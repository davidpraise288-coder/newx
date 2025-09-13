// Export all OpenChat actions
export { sendMessageAction } from './send-message.js';
export { joinGroupAction } from './join-group.js';
export { leaveGroupAction } from './leave-group.js';
export { getMessagesAction } from './get-messages.js';

// Re-export for convenience
export const openChatActions = [
  sendMessageAction,
  joinGroupAction,
  leaveGroupAction,
  getMessagesAction,
];

export default openChatActions;