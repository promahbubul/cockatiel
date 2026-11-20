import { Schema, model, Document, Types } from 'mongoose';

export interface IReaction {
  userId: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface IReplyTo {
  messageId: Types.ObjectId;
  senderName: string;
  text?: string;
  mediaType?: string;
}

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  caption?: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  reactions: IReaction[];
  readBy: Types.ObjectId[];
  replyTo?: IReplyTo;
  createdAt: Date;
  updatedAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', null], default: null },
    caption: { type: String, default: null },
    status: { type: String, enum: ['SENT', 'DELIVERED', 'READ'], default: 'SENT' },
    reactions: [ReactionSchema],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replyTo: {
      messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
      senderName: { type: String },
      text: { type: String },
      mediaType: { type: String },
    },
  },
  { timestamps: true }
);

export const Message = model<IMessage>('Message', MessageSchema);
