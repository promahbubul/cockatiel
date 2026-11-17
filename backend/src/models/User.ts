import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  displayName: string;
  avatarUrl?: string;
  about: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
  verificationCode?: {
    code: string;
    expiresAt: Date;
  };
  resetPasswordCode?: {
    code: string;
    expiresAt: Date;
  };
  contacts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    about: { type: String, default: 'Living life one bubble at a time 🫧' },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    verificationCode: {
      code: { type: String },
      expiresAt: { type: Date },
    },
    resetPasswordCode: {
      code: { type: String },
      expiresAt: { type: Date },
    },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
