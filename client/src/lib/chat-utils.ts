import type { Conversation, ConversationUnreadCount } from '@/types/chat.types';
import type { UserRole } from '@/types/user.types';

export function getUnreadForUser(
  unreadCount: ConversationUnreadCount | undefined,
  role: UserRole | undefined
): number {
  if (!unreadCount) return 0;
  if (role === 'owner') return unreadCount.owner;
  return unreadCount.tenant;
}

export function getOtherPartyName(conversation: Conversation): string {
  const other = conversation.otherParty;
  if (other && typeof other !== 'string') {
    return other.fullName;
  }
  return 'User';
}

export function getConversationPropertyTitle(conversation: Conversation): string {
  const property = conversation.property;
  if (property && typeof property !== 'string') {
    return property.title ?? 'Property';
  }
  return 'Property';
}

export function getConversationCoverUrl(conversation: Conversation): string | null {
  const property = conversation.property;
  if (property && typeof property !== 'string') {
    return property.coverPhoto?.url ?? null;
  }
  return null;
}

export function sumUnreadConversations(
  conversations: Conversation[],
  role: UserRole | undefined
): number {
  return conversations.reduce(
    (total, conversation) => total + getUnreadForUser(conversation.unreadCount, role),
    0
  );
}
