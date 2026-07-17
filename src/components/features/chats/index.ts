/**
 * @file chats/index.ts
 * @description Публичный API домена чатов (re-exports)
 */

export { ChatCard } from './ChatCard';
export { ChatList } from './ChatList';

export type { ChatCardProps } from './ChatCard/ChatCard';
export type { ChatListItem, ChatListResponse } from '@/domains/comms/comms.types';
