import { z } from 'zod';
import {
  CHAT_MESSAGES_DEFAULT_LIMIT,
  CHAT_MESSAGES_DEFAULT_PAGE,
  CHAT_MESSAGES_MAX_LIMIT,
  MESSAGE_CONTENT_MAX_LENGTH,
  MESSAGE_CONTENT_MIN_LENGTH,
} from '@/constants/chat.constants';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');

export const createConversationSchema = z.object({
  propertyId: objectIdSchema,
  otherUserId: objectIdSchema,
});

export const conversationIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const getMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(CHAT_MESSAGES_DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(CHAT_MESSAGES_MAX_LIMIT)
    .optional()
    .default(CHAT_MESSAGES_DEFAULT_LIMIT),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(MESSAGE_CONTENT_MIN_LENGTH, 'Message cannot be empty')
    .max(
      MESSAGE_CONTENT_MAX_LENGTH,
      `Message must be at most ${MESSAGE_CONTENT_MAX_LENGTH} characters`
    ),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type ConversationIdParams = z.infer<typeof conversationIdParamsSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
