import { Schema, model, Document, Types } from 'mongoose';

export interface IUserSettings {
  showNotifications?: boolean;
  messagePreviews?: boolean;
  sounds?: boolean;
  vibrate?: boolean;
  readReceipts?: boolean;
  lastSeenPrivacy?: 'everyone' | 'contacts' | 'nobody';
}

export interface IUser extends Document {
  email: string;
  password?: string;
  displayName: string;
  avatarUrl?: string;
  about: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  settings?: IUserSettings;
  verificationCode?: {
    code: string;
    expiresAt: Date;
  };
  resetPasswordCode?: {
    code: string;
    expiresAt: Date;
  };
  contacts: Types.ObjectId[];
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    about: { type: String, default: 'Chirping happily on Cockatiel 🦜' },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    settings: {
      showNotifications: { type: Boolean, default: true },
      messagePreviews: { type: Boolean, default: true },
      sounds: { type: Boolean, default: true },
      vibrate: { type: Boolean, default: true },
      readReceipts: { type: Boolean, default: true },
      lastSeenPrivacy: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    },
    verificationCode: {
      code: { type: String },
      expiresAt: { type: Date },
    },
    resetPasswordCode: {
      code: { type: String },
      expiresAt: { type: Date },
    },
    pushToken: { type: String, default: null },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
