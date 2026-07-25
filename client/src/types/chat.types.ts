export interface ChatUserSummary {
  _id: string;
  fullName: string;
}

export interface ConversationPropertySummary {
  _id: string;
  title?: string;
  coverPhoto: { url: string; publicId: string } | null;
}

export interface ConversationUnreadCount {
  tenant: number;
  owner: number;
}

export interface Conversation {
  _id: string;
  property: string | ConversationPropertySummary;
  tenant: string | ChatUserSummary;
  owner: string | ChatUserSummary;
  otherParty?: string | ChatUserSummary;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: ConversationUnreadCount;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: string;
  content: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationPayload {
  propertyId: string;
  otherUserId: string;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
}
