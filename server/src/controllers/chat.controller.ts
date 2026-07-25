import type { Request, Response } from 'express';
import * as chatService from '@/services/chat.service';
import type {
  CreateConversationInput,
  GetMessagesQuery,
  SendMessageInput,
} from '@/validators/chat.validator';

export async function createConversation(req: Request, res: Response): Promise<void> {
  const conversation = await chatService.getOrCreateConversationForUser(
    req.user!.id,
    req.body as CreateConversationInput
  );

  res.status(200).json({
    success: true,
    data: { conversation },
  });
}

export async function getMyConversations(req: Request, res: Response): Promise<void> {
  const conversations = await chatService.getMyConversations(req.user!.id);

  res.status(200).json({
    success: true,
    data: { conversations },
  });
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  const result = await chatService.getMessages(
    req.params.id as string,
    req.user!.id,
    req.validatedQuery as GetMessagesQuery
  );

  res.status(200).json({
    success: true,
    data: { messages: result.messages },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
    },
  });
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { content } = req.body as SendMessageInput;
  const result = await chatService.sendMessage(
    req.params.id as string,
    req.user!.id,
    content
  );

  res.status(201).json({
    success: true,
    data: { message: result.message },
  });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const conversation = await chatService.markAsRead(
    req.params.id as string,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: { conversation },
  });
}
