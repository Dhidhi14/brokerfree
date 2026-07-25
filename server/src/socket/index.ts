import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import {
  MESSAGE_CONTENT_MAX_LENGTH,
  MESSAGE_CONTENT_MIN_LENGTH,
} from '@/constants/chat.constants';
import { env } from '@/config/env';
import * as chatService from '@/services/chat.service';
import { AppError } from '@/utils/app-error';
import { verifyAccessToken } from '@/utils/jwt';
import { logger } from '@/utils/logger';

interface SocketData {
  userId: string;
  role: string;
}

interface JoinConversationPayload {
  conversationId: string;
}

interface SendMessagePayload {
  conversationId: string;
  content: string;
}

interface TypingPayload {
  conversationId: string;
}

interface ClientToServerEvents {
  'join-conversation': (payload: JoinConversationPayload) => void;
  'send-message': (payload: SendMessagePayload) => void;
  typing: (payload: TypingPayload) => void;
}

interface ServerToClientEvents {
  'joined-conversation': (payload: { conversationId: string }) => void;
  'new-message': (payload: {
    message: unknown;
    conversationId: string;
  }) => void;
  typing: (payload: { conversationId: string; userId: string }) => void;
  error: (payload: { code: string; message: string }) => void;
}

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: AppServer | null = null;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function emitSocketError(socket: AppSocket, error: unknown): void {
  if (error instanceof AppError) {
    socket.emit('error', {
      code: error.errorCode,
      message: error.message,
    });
    return;
  }

  logger.error('Socket event error', { error });
  socket.emit('error', {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}

export function initSocket(httpServer: HttpServer): AppServer {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!isNonEmptyString(token)) {
        next(new Error('Authentication required'));
        return;
      }

      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid or expired access token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;

    void socket.join(`user:${userId}`);
    logger.info('Socket connected', { userId, socketId: socket.id });

    socket.on('join-conversation', (payload) => {
      void (async () => {
        try {
          if (!isNonEmptyString(payload?.conversationId)) {
            throw new AppError('conversationId is required', 400, 'VALIDATION_ERROR');
          }

          await chatService.assertUserIsParticipant(payload.conversationId, userId);
          await socket.join(`conversation:${payload.conversationId}`);
          socket.emit('joined-conversation', {
            conversationId: payload.conversationId,
          });
        } catch (error: unknown) {
          emitSocketError(socket, error);
        }
      })();
    });

    socket.on('send-message', (payload) => {
      void (async () => {
        try {
          if (!isNonEmptyString(payload?.conversationId)) {
            throw new AppError('conversationId is required', 400, 'VALIDATION_ERROR');
          }

          if (!isNonEmptyString(payload?.content)) {
            throw new AppError('content is required', 400, 'VALIDATION_ERROR');
          }

          const content = payload.content.trim();
          if (
            content.length < MESSAGE_CONTENT_MIN_LENGTH ||
            content.length > MESSAGE_CONTENT_MAX_LENGTH
          ) {
            throw new AppError(
              `Message must be between ${MESSAGE_CONTENT_MIN_LENGTH} and ${MESSAGE_CONTENT_MAX_LENGTH} characters`,
              400,
              'INVALID_MESSAGE_CONTENT'
            );
          }

          const result = await chatService.sendMessage(
            payload.conversationId,
            userId,
            content
          );

          const eventPayload = {
            message: result.message,
            conversationId: payload.conversationId,
          };

          io?.to(`conversation:${payload.conversationId}`).emit(
            'new-message',
            eventPayload
          );
          io?.to(`user:${result.otherUserId}`).emit('new-message', eventPayload);
        } catch (error: unknown) {
          emitSocketError(socket, error);
        }
      })();
    });

    socket.on('typing', (payload) => {
      void (async () => {
        try {
          if (!isNonEmptyString(payload?.conversationId)) {
            throw new AppError('conversationId is required', 400, 'VALIDATION_ERROR');
          }

          await chatService.assertUserIsParticipant(payload.conversationId, userId);

          socket.to(`conversation:${payload.conversationId}`).emit('typing', {
            conversationId: payload.conversationId,
            userId,
          });
        } catch (error: unknown) {
          emitSocketError(socket, error);
        }
      })();
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { userId, socketId: socket.id, reason });
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

export function getIO(): AppServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}
