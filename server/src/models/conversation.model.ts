import mongoose, { Schema, type HydratedDocument } from 'mongoose';

export interface IConversationUnreadCount {
  tenant: number;
  owner: number;
}

export interface IConversation {
  property: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: IConversationUnreadCount;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationDocument = HydratedDocument<IConversation>;

const unreadCountSchema = new Schema<IConversationUnreadCount>(
  {
    tenant: { type: Number, default: 0, min: 0 },
    owner: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: String,
      trim: true,
    },
    lastMessageAt: {
      type: Date,
    },
    unreadCount: {
      type: unreadCountSchema,
      default: () => ({ tenant: 0, owner: 0 }),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const record = ret as Record<string, unknown>;
        delete record.__v;
        return record;
      },
    },
  }
);

conversationSchema.index({ property: 1, tenant: 1, owner: 1 }, { unique: true });
conversationSchema.index({ tenant: 1, lastMessageAt: -1 });
conversationSchema.index({ owner: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
