import mongoose from 'mongoose';
import { MESSAGE_CONTENT_MAX_LENGTH } from '@/constants/chat.constants';
import {
  Conversation,
  type ConversationDocument,
  type IConversation,
} from '@/models/conversation.model';
import { Message, type IMessage } from '@/models/message.model';
import { Property } from '@/models/property.model';
import { AppError } from '@/utils/app-error';
import type {
  CreateConversationInput,
  GetMessagesQuery,
} from '@/validators/chat.validator';

export interface PaginatedMessages {
  messages: IMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SendMessageResult {
  message: IMessage;
  conversation: IConversation;
  otherUserId: string;
}

interface ConversationListItem extends Omit<IConversation, 'property' | 'tenant' | 'owner'> {
  property: {
    _id: unknown;
    title?: string;
    coverPhoto: { url: string; publicId: string } | null;
  } | unknown;
  tenant: unknown;
  owner: unknown;
  otherParty: unknown;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
}

function refIdToString(value: unknown): string {
  if (value !== null && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function assertValidObjectId(id: string, notFoundCode: string, message: string): void {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(message, 404, notFoundCode);
  }
}

async function findConversationOrThrow(conversationId: string): Promise<ConversationDocument> {
  assertValidObjectId(conversationId, 'CONVERSATION_NOT_FOUND', 'Conversation not found');

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  return conversation;
}

function assertParticipant(conversation: ConversationDocument, userId: string): void {
  const tenantId = conversation.tenant.toString();
  const ownerId = conversation.owner.toString();

  if (userId !== tenantId && userId !== ownerId) {
    throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }
}

function getParticipantRole(
  conversation: ConversationDocument,
  userId: string
): 'tenant' | 'owner' {
  if (userId === conversation.tenant.toString()) {
    return 'tenant';
  }
  if (userId === conversation.owner.toString()) {
    return 'owner';
  }
  throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
}

/**
 * Resolves tenant/owner from property ownership for either initiator role.
 */
export async function resolveConversationParticipants(
  userId: string,
  input: CreateConversationInput
): Promise<{ propertyId: string; tenantId: string; ownerId: string }> {
  assertValidObjectId(input.propertyId, 'PROPERTY_NOT_FOUND', 'Property not found');
  assertValidObjectId(input.otherUserId, 'USER_NOT_FOUND', 'User not found');

  if (userId === input.otherUserId) {
    throw new AppError(
      'Cannot start a conversation with yourself',
      400,
      'INVALID_CONVERSATION_PARTICIPANTS'
    );
  }

  const property = await Property.findById(input.propertyId).select('owner').lean();

  if (!property) {
    throw new AppError('Property not found', 404, 'PROPERTY_NOT_FOUND');
  }

  const propertyOwnerId = property.owner.toString();

  if (userId === propertyOwnerId) {
    return {
      propertyId: input.propertyId,
      tenantId: input.otherUserId,
      ownerId: propertyOwnerId,
    };
  }

  if (input.otherUserId !== propertyOwnerId) {
    throw new AppError(
      'You can only chat with the property owner about this listing',
      400,
      'INVALID_CONVERSATION_PARTICIPANTS'
    );
  }

  return {
    propertyId: input.propertyId,
    tenantId: userId,
    ownerId: propertyOwnerId,
  };
}

export async function getOrCreateConversation(
  propertyId: string,
  tenantId: string,
  ownerId: string
): Promise<IConversation> {
  const existing = await Conversation.findOne({
    property: propertyId,
    tenant: tenantId,
    owner: ownerId,
  }).lean();

  if (existing) {
    return existing;
  }

  try {
    const conversation = await Conversation.create({
      property: propertyId,
      tenant: tenantId,
      owner: ownerId,
      unreadCount: { tenant: 0, owner: 0 },
    });

    return conversation.toObject();
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      const raced = await Conversation.findOne({
        property: propertyId,
        tenant: tenantId,
        owner: ownerId,
      }).lean();

      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}

export async function getOrCreateConversationForUser(
  userId: string,
  input: CreateConversationInput
): Promise<IConversation> {
  const { propertyId, tenantId, ownerId } = await resolveConversationParticipants(
    userId,
    input
  );
  return getOrCreateConversation(propertyId, tenantId, ownerId);
}

export async function getMyConversations(userId: string): Promise<ConversationListItem[]> {
  const conversations = await Conversation.find({
    $or: [{ tenant: userId }, { owner: userId }],
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate({
      path: 'property',
      select: 'title photos',
    })
    .populate({
      path: 'tenant',
      select: 'fullName',
    })
    .populate({
      path: 'owner',
      select: 'fullName',
    })
    .lean();

  return conversations.map((conversation) => {
    const tenantId = refIdToString(conversation.tenant);
    const callerIsTenant = tenantId === userId;
    const otherParty = callerIsTenant ? conversation.owner : conversation.tenant;

    const propertyDoc = conversation.property as unknown as {
      _id: unknown;
      title?: string;
      photos?: Array<{ url: string; publicId: string; isCover: boolean }>;
    } | null;

    const cover =
      propertyDoc?.photos?.find((photo) => photo.isCover) ?? propertyDoc?.photos?.[0] ?? null;

    return {
      ...conversation,
      otherParty,
      property: propertyDoc
        ? {
            _id: propertyDoc._id,
            title: propertyDoc.title,
            coverPhoto: cover
              ? { url: cover.url, publicId: cover.publicId }
              : null,
          }
        : conversation.property,
    };
  });
}

export async function getMessages(
  conversationId: string,
  userId: string,
  options: GetMessagesQuery
): Promise<PaginatedMessages> {
  const conversation = await findConversationOrThrow(conversationId);
  assertParticipant(conversation, userId);

  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversation: conversationId }),
  ]);

  return {
    messages,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<SendMessageResult> {
  const trimmed = content.trim();

  if (trimmed.length < 1 || trimmed.length > MESSAGE_CONTENT_MAX_LENGTH) {
    throw new AppError(
      `Message must be between 1 and ${MESSAGE_CONTENT_MAX_LENGTH} characters`,
      400,
      'INVALID_MESSAGE_CONTENT'
    );
  }

  const conversation = await findConversationOrThrow(conversationId);
  assertParticipant(conversation, senderId);

  const role = getParticipantRole(conversation, senderId);
  const otherRole = role === 'tenant' ? 'owner' : 'tenant';
  const otherUserId =
    otherRole === 'tenant'
      ? conversation.tenant.toString()
      : conversation.owner.toString();

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content: trimmed,
  });

  conversation.lastMessage = trimmed;
  conversation.lastMessageAt = message.createdAt;
  conversation.unreadCount[otherRole] += 1;
  await conversation.save();

  return {
    message: message.toObject(),
    conversation: conversation.toObject(),
    otherUserId,
  };
}

export async function markAsRead(
  conversationId: string,
  userId: string
): Promise<IConversation> {
  const conversation = await findConversationOrThrow(conversationId);
  assertParticipant(conversation, userId);

  const role = getParticipantRole(conversation, userId);

  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      $or: [{ readAt: { $exists: false } }, { readAt: null }],
    },
    { $set: { readAt: new Date() } }
  );

  conversation.unreadCount[role] = 0;
  await conversation.save();

  return conversation.toObject();
}

export async function assertUserIsParticipant(
  conversationId: string,
  userId: string
): Promise<ConversationDocument> {
  const conversation = await findConversationOrThrow(conversationId);
  assertParticipant(conversation, userId);
  return conversation;
}
