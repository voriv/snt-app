// Re-export public API of comms domain

// Types
export type {
  ChatListItem,
  ChatListResponse,
  ChatMemberRole,
  Conversation,
  ConversationParticipant,
  Message,
  ConversationType,
  ParticipantRole,
  ConversationListItem,
  ConversationListResponse,
  CreateChatData,
  MessageListItem,
  ConversationMessagesResponse,
  MessageDeleteData,
  MessageReaction,
  MessageReadStatus,
} from './comms.types';

// Errors
export {
  ConversationNotFoundError,
  ConversationAccessDeniedError,
  MessageNotFoundError,
  ChatNameExistsError,
  TooManyParticipantsError,
} from './comms.errors';

// Validators
export {
  getConversationsQuerySchema,
  conversationListItemSchema,
  conversationListResponseSchema,
  createChatSchema,
  sendMessageSchema,
  messageListItemSchema,
  conversationMessagesResponseSchema,
  messageDeleteSchema,
  messageReactionSchema,
  messageReadStatusSchema,
} from './comms.validators';

// Repository
export type { ICommsRepository, GetUserConversationsOptions } from './comms.repository.interface';
export { PrismaCommsRepository } from './comms.repository.prisma';

// Service
export { CommsService } from './comms.service';

// UI Components
export { ConversationCard } from '@/components/features/comms/ConversationCard';
export type { ConversationCardProps } from '@/components/features/comms/ConversationCard';
export { ConversationList } from '@/components/features/comms/ConversationList';
export { ConversationEmptyState } from '@/components/features/comms/ConversationEmptyState';
