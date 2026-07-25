import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import * as chatApi from '@/api/chat.api';
import { MessageBubble } from '@/components/chat/message-bubble';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  appendMessageToCache,
  chatKeys,
  useConversationsQuery,
  useMarkAsReadMutation,
  useMessagesQuery,
} from '@/hooks/use-chat';
import { useSocket } from '@/hooks/use-socket';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  getConversationPropertyTitle,
  getOtherPartyName,
} from '@/lib/chat-utils';
import { useAuthStore } from '@/store/auth-store';
import type { ChatMessage } from '@/types/chat.types';

const TYPING_DEBOUNCE_MS = 400;
const TYPING_CLEAR_MS = 2000;

export function ChatThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: conversations = [] } = useConversationsQuery();
  const {
    data: messages = [],
    isLoading,
    isError,
    error,
  } = useMessagesQuery(conversationId);
  const markAsReadMutation = useMarkAsReadMutation();

  const [draft, setDraft] = useState('');
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinedRef = useRef<string | null>(null);

  const conversation = useMemo(
    () => conversations.find((item) => item._id === conversationId),
    [conversations, conversationId]
  );

  const otherName = conversation ? getOtherPartyName(conversation) : 'Chat';
  const propertyTitle = conversation
    ? getConversationPropertyTitle(conversation)
    : 'Property';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUserId]);

  useEffect(() => {
    if (!conversationId) return;
    markAsReadMutation.mutate(conversationId);
    // Intentionally only when conversation opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    if (joinedRef.current !== conversationId) {
      socket.emit('join-conversation', { conversationId });
      joinedRef.current = conversationId;
    }

    const handleNewMessage = (payload: {
      message: ChatMessage;
      conversationId: string;
    }) => {
      if (payload.conversationId !== conversationId) return;

      appendMessageToCache(queryClient, conversationId, payload.message);
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });

      if (payload.message.sender !== user?._id) {
        void chatApi.markAsRead(conversationId).then(() => {
          void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
        });
      }
    };

    const handleTyping = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === user?._id) return;

      setTypingUserId(payload.userId);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => {
        setTypingUserId(null);
      }, TYPING_CLEAR_MS);
    };

    const handleSocketError = (payload: { code: string; message: string }) => {
      toast.error(payload.message || 'Chat error');
    };

    socket.on('new-message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('error', handleSocketError);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [socket, isConnected, conversationId, queryClient, user?._id]);

  const emitTyping = () => {
    if (!socket || !isConnected || !conversationId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId });
    }, TYPING_DEBOUNCE_MS);
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!socket || !isConnected || !conversationId || !user) {
      toast.error('Not connected to chat. Please wait and try again.');
      return;
    }

    const content = draft.trim();
    if (!content) return;

    const optimistic: ChatMessage = {
      _id: `temp-${crypto.randomUUID()}`,
      conversation: conversationId,
      sender: user._id,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    appendMessageToCache(queryClient, conversationId, optimistic);
    setDraft('');
    socket.emit('send-message', { conversationId, content });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:py-6">
        <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/chat" aria-label="Back to messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{otherName}</h1>
            <p className="truncate text-sm text-muted-foreground">{propertyTitle}</p>
          </div>
          {!isConnected ? (
            <span className="ml-auto text-xs text-amber-600">Connecting…</span>
          ) : null}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-gradient-to-b from-indigo-50/40 to-background p-3 sm:p-4">
          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
            </div>
          ) : null}

          {isError ? (
            <p className="py-12 text-center text-destructive">
              {getApiErrorMessage(error, 'Failed to load messages')}
            </p>
          ) : null}

          {!isLoading && !isError && messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          ) : null}

          {!isLoading && !isError
            ? messages.map((message) => (
                <MessageBubble
                  key={message._id}
                  content={message.content}
                  createdAt={message.createdAt}
                  isMine={message.sender === user?._id}
                  isOptimistic={message._id.startsWith('temp-')}
                />
              ))
            : null}

          {typingUserId ? (
            <p className="px-1 text-xs text-muted-foreground animate-pulse">
              {otherName} is typing…
            </p>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <Input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              emitTyping();
            }}
            placeholder="Type a message…"
            maxLength={2000}
            autoComplete="off"
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!draft.trim() || !isConnected}
            className="brand-gradient text-primary-foreground hover:opacity-90"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
