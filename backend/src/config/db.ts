import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cockatiel';

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to: ${uri.split('@').pop()}`);
  } catch (err: any) {
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB (${err.message}). Running with mock/memory fallback.`);
  }
}

export const connectDatabase = connectDB;
