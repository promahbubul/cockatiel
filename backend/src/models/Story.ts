import { Schema, model, Document, Types } from 'mongoose';

export interface IStory extends Document {
  userId: Types.ObjectId;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewers: Types.ObjectId[];
  createdAt: Date;
  expiresAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    caption: { type: String, default: '' },
    viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

export const Story = model<IStory>('Story', StorySchema);
