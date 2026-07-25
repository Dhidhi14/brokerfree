import { Router } from 'express';
import * as chatController from '@/controllers/chat.controller';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/async-handler';
import {
  conversationIdParamsSchema,
  createConversationSchema,
  getMessagesQuerySchema,
  sendMessageSchema,
} from '@/validators/chat.validator';

const router = Router();

router.use(authenticate);

router.post(
  '/conversations',
  validate(createConversationSchema),
  asyncHandler(chatController.createConversation)
);

router.get('/conversations', asyncHandler(chatController.getMyConversations));

router.get(
  '/conversations/:id/messages',
  validate(conversationIdParamsSchema, 'params'),
  validate(getMessagesQuerySchema, 'query'),
  asyncHandler(chatController.getMessages)
);

router.post(
  '/conversations/:id/messages',
  validate(conversationIdParamsSchema, 'params'),
  validate(sendMessageSchema),
  asyncHandler(chatController.sendMessage)
);

router.patch(
  '/conversations/:id/read',
  validate(conversationIdParamsSchema, 'params'),
  asyncHandler(chatController.markAsRead)
);

export { router as chatRoutes };
