import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  email: string;
  phoneNumber?: string;
  username?: string;
  displayName: string;
  avatarUrl?: string;
  about: string;
  isOnline: boolean;
  lastSeen: Date;
  contacts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    phoneNumber: { type: String, sparse: true },
    username: { type: String, sparse: true, unique: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    about: { type: String, default: 'Living life one bubble at a time 🫧' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
