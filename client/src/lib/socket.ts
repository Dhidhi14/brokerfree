import { io, type Socket } from 'socket.io-client';

export interface ClientToServerEvents {
  'join-conversation': (payload: { conversationId: string }) => void;
  'send-message': (payload: { conversationId: string; content: string }) => void;
  typing: (payload: { conversationId: string }) => void;
}

export interface ServerToClientEvents {
  'joined-conversation': (payload: { conversationId: string }) => void;
  'new-message': (payload: {
    message: {
      _id: string;
      conversation: string;
      sender: string;
      content: string;
      readAt?: string;
      createdAt: string;
      updatedAt: string;
    };
    conversationId: string;
  }) => void;
  typing: (payload: { conversationId: string; userId: string }) => void;
  error: (payload: { code: string; message: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Socket.io attaches to the HTTP server root, while VITE_API_URL includes /api.
 */
export function getSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? '';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function createSocket(accessToken: string): AppSocket {
  return io(getSocketUrl(), {
    auth: { token: accessToken },
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
}
