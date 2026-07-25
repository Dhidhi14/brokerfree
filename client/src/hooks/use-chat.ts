import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as chatApi from '@/api/chat.api';
import { getApiResponseError } from '@/lib/api-error';
import type { ChatMessage, CreateConversationPayload } from '@/types/chat.types';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
};

export function useConversationsQuery(enabled = true) {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: async () => {
      const response = await chatApi.getConversations();

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to load conversations'));
      }

      return response.data.conversations;
    },
    enabled,
  });
}

export function useMessagesQuery(conversationId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ''),
    queryFn: async () => {
      const id = conversationId!;
      const first = await chatApi.getMessages(id, { page: 1, limit: 50 });

      if (!first.success || !first.data) {
        throw new Error(getApiResponseError(first, 'Failed to load messages'));
      }

      const total = first.meta?.total ?? first.data.messages.length;
      const limit = first.meta?.limit ?? 50;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      // Backend pages oldest→newest; load the last page for recent history
      if (totalPages <= 1) {
        return first.data.messages;
      }

      const last = await chatApi.getMessages(id, { page: totalPages, limit });

      if (!last.success || !last.data) {
        throw new Error(getApiResponseError(last, 'Failed to load messages'));
      }

      return last.data.messages;
    },
    enabled: Boolean(conversationId) && enabled,
  });
}

export function useGetOrCreateConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateConversationPayload) => {
      const response = await chatApi.getOrCreateConversation(
        payload.propertyId,
        payload.otherUserId
      );

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to start conversation'));
      }

      return response.data.conversation;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await chatApi.markAsRead(conversationId);

      if (!response.success || !response.data) {
        throw new Error(getApiResponseError(response, 'Failed to mark as read'));
      }

      return response.data.conversation;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function appendMessageToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: ChatMessage
): void {
  queryClient.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (prev) => {
    if (!prev) return [message];
    if (prev.some((item) => item._id === message._id)) {
      return prev;
    }

    // Drop matching optimistic temp messages from the same sender/content
    const withoutTemp = prev.filter((item) => {
      if (!item._id.startsWith('temp-')) return true;
      return !(item.sender === message.sender && item.content === message.content);
    });

    return [...withoutTemp, message];
  });
}
