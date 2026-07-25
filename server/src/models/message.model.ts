import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import { MESSAGE_CONTENT_MAX_LENGTH } from '@/constants/chat.constants';

export interface IMessage {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageDocument = HydratedDocument<IMessage>;

const messageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: MESSAGE_CONTENT_MAX_LENGTH,
    },
    readAt: {
      type: Date,
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

messageSchema.index({ conversation: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
