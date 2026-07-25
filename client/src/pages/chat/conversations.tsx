import { Link } from 'react-router-dom';
import { Loader2, MessageSquare } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useConversationsQuery } from '@/hooks/use-chat';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  getConversationCoverUrl,
  getConversationPropertyTitle,
  getOtherPartyName,
  getUnreadForUser,
} from '@/lib/chat-utils';
import { formatDateTime } from '@/lib/format-date';
import { useAuthStore } from '@/store/auth-store';

export function ConversationsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: conversations = [], isLoading, isError, error } = useConversationsQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 animate-slide-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="mt-2 text-muted-foreground">
            Chat with owners and tenants about properties.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading" />
          </div>
        ) : null}

        {isError ? (
          <Card className="border-destructive/30">
            <CardContent className="py-12 text-center">
              <p className="text-destructive">
                {getApiErrorMessage(error, 'Failed to load conversations')}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && conversations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No conversations yet</p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && conversations.length > 0 ? (
          <ul className="space-y-3">
            {conversations.map((conversation) => {
              const unread = getUnreadForUser(conversation.unreadCount, user?.role);
              const coverUrl = getConversationCoverUrl(conversation);
              const otherName = getOtherPartyName(conversation);
              const propertyTitle = getConversationPropertyTitle(conversation);

              return (
                <li key={conversation._id}>
                  <Link
                    to={`/chat/${conversation._id}`}
                    className="block rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex gap-3 p-3 sm:p-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{otherName}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {propertyTitle}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {conversation.lastMessageAt ? (
                              <span className="text-[11px] text-muted-foreground">
                                {formatDateTime(conversation.lastMessageAt)}
                              </span>
                            ) : null}
                            {unread > 0 ? (
                              <Badge className="bg-indigo-600 hover:bg-indigo-600">
                                {unread > 99 ? '99+' : unread}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
