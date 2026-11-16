import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Chat } from './models/Chat.js';
import { Message } from './models/Message.js';
import { CallLog } from './models/CallLog.js';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cockatiel';

export async function seedDatabase() {
  console.log('[Seed] Connecting to MongoDB:', uri);
  await mongoose.connect(uri);

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
    CallLog.deleteMany({}),
  ]);

  console.log('[Seed] Inserting users...');
  const users = await User.insertMany([
    {
      phoneNumber: '+15550001234',
      displayName: 'Alex Johnson',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      about: 'Living life one bubble at a time 🫧 | Exploring the world 🌍',
      isOnline: true,
    },
    {
      phoneNumber: '+15550005678',
      displayName: 'Emma Watson',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      about: 'Hey there! I am using Cockatiel 🦜',
      isOnline: true,
    },
    {
      phoneNumber: '+15550009012',
      displayName: 'Lucas Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      about: 'Music producer 🎵 & Coffee enthusiast ☕',
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600 * 1000 * 4),
    },
    {
      phoneNumber: '+15550003456',
      displayName: 'Mia Wong',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
      about: 'Frontend developer 💻 | Tech lover',
      isOnline: true,
    },
    {
      phoneNumber: '+15550007890',
      displayName: 'Oliver Smith',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      about: 'Photography & traveling 📷✈️',
      isOnline: true,
    },
  ]);

  const [me, emma, lucas, mia, oliver] = users;

  console.log('[Seed] Creating direct and group chats...');
  const chat1 = await Chat.create({
    isGroup: false,
    participants: [me._id, emma._id],
    lastMessage: {
      text: 'Are we still on for coffee later?',
      senderId: emma._id,
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
    unreadCounts: new Map([[me._id.toString(), 2], [emma._id.toString(), 0]]),
  });

  const chat2 = await Chat.create({
    isGroup: false,
    participants: [me._id, lucas._id],
    lastMessage: {
      text: 'Check out this new track I found',
      senderId: lucas._id,
      timestamp: new Date(Date.now() - 86400 * 1000),
    },
    unreadCounts: new Map([[me._id.toString(), 1], [lucas._id.toString(), 0]]),
  });

  const groupChat = await Chat.create({
    isGroup: true,
    groupName: 'Design Team 🎨',
    groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
    participants: [me._id, emma._id, mia._id, oliver._id],
    admins: [me._id],
    lastMessage: {
      text: 'Great progress on the new mockups today everyone!',
      senderId: me._id,
      timestamp: new Date(Date.now() - 3600 * 1000 * 6),
    },
    unreadCounts: new Map([[emma._id.toString(), 0], [mia._id.toString(), 0]]),
  });

  console.log('[Seed] Inserting sample messages for chat1...');
  await Message.insertMany([
    {
      chatId: chat1._id,
      senderId: emma._id,
      content: 'Hey Alex! How is your day going?',
      status: 'READ',
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      chatId: chat1._id,
      senderId: me._id,
      content: 'Hey Emma! Pretty busy with the new design update, but doing well!',
      status: 'READ',
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      chatId: chat1._id,
      senderId: emma._id,
      content: 'Awesome! Did you see the latest color palette proposal?',
      status: 'READ',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      chatId: chat1._id,
      senderId: emma._id,
      content: 'Are we still on for coffee later?',
      status: 'DELIVERED',
      reactions: [
        {
          userId: me._id,
          emoji: '👍',
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  ]);

  console.log('[Seed] Inserting call logs...');
  await CallLog.insertMany([
    {
      callerId: emma._id,
      receiverId: me._id,
      callType: 'audio',
      direction: 'incoming',
      duration: '4:15',
      roomName: 'room-audio-101',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
    {
      callerId: me._id,
      receiverId: lucas._id,
      callType: 'video',
      direction: 'outgoing',
      duration: '12:30',
      roomName: 'room-video-102',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
    {
      callerId: mia._id,
      receiverId: me._id,
      callType: 'audio',
      direction: 'missed',
      roomName: 'room-audio-103',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    },
  ]);

  console.log('✅ Database seeded successfully!');
  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
