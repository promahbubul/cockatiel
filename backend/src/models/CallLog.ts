import { Schema, model, Document, Types } from 'mongoose';

export interface ICallLog extends Document {
  callerId: Types.ObjectId;
  receiverId: Types.ObjectId;
  callType: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  duration?: string;
  roomName: string;
  createdAt: Date;
}

const CallLogSchema = new Schema<ICallLog>(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callType: { type: String, enum: ['audio', 'video'], required: true },
    direction: { type: String, enum: ['incoming', 'outgoing', 'missed'], required: true },
    duration: { type: String, default: null },
    roomName: { type: String, required: true },
  },
  { timestamps: true }
);

export const CallLog = model<ICallLog>('CallLog', CallLogSchema);
