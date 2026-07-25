import { apiGet, apiPatch, apiPost } from '@/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  ChatMessage,
  Conversation,
  CreateConversationPayload,
  GetMessagesParams,
} from '@/types/chat.types';

export interface ConversationData {
  conversation: Conversation;
}

export interface ConversationsData {
  conversations: Conversation[];
}

export interface MessagesData {
  messages: ChatMessage[];
}

function buildMessagesQuery(params: GetMessagesParams = {}): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getOrCreateConversation(
  propertyId: string,
  otherUserId: string
): Promise<ApiResponse<ConversationData>> {
  const body: CreateConversationPayload = { propertyId, otherUserId };
  return apiPost<ConversationData>('/chat/conversations', body);
}

export function getConversations(): Promise<ApiResponse<ConversationsData>> {
  return apiGet<ConversationsData>('/chat/conversations');
}

export function getMessages(
  conversationId: string,
  params: GetMessagesParams = {}
): Promise<ApiResponse<MessagesData>> {
  return apiGet<MessagesData>(
    `/chat/conversations/${conversationId}/messages${buildMessagesQuery(params)}`
  );
}

export function markAsRead(conversationId: string): Promise<ApiResponse<ConversationData>> {
  return apiPatch<ConversationData>(`/chat/conversations/${conversationId}/read`);
}
