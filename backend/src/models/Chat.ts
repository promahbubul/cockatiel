import { Schema, model, Document, Types } from 'mongoose';

export interface IChat extends Document {
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  participants: Types.ObjectId[];
  admins: Types.ObjectId[];
  lastMessage?: {
    text: string;
    senderId: Types.ObjectId;
    timestamp: Date;
  };
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, default: null },
    groupAvatar: { type: String, default: null },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: {
      text: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
    },
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

export const Chat = model<IChat>('Chat', ChatSchema);
