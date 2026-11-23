import { FastifyRequest, FastifyReply } from 'fastify';
import { Types } from 'mongoose';
import { Story } from '../models/Story.js';
import { User } from '../models/User.js';
import { getIO } from '../sockets/index.js';

export async function createStory(
  request: FastifyRequest<{
    Body: {
      mediaUrl: string;
      mediaType?: 'image' | 'video';
      caption?: string;
    };
  }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { mediaUrl, mediaType = 'image', caption = '' } = request.body || {};

  if (!mediaUrl) {
    return reply.status(400).send({ error: 'mediaUrl is required' });
  }

  const user = await User.findById(currentUserId).select('displayName avatarUrl');
  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  const story = await Story.create({
    userId: new Types.ObjectId(currentUserId),
    mediaUrl,
    mediaType,
    caption,
    viewers: [],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const storyData = {
    id: story._id.toString(),
    userId: currentUserId,
    user: {
      id: user._id.toString(),
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption,
    viewersCount: 0,
    isViewed: false,
    createdAt: story.createdAt,
    expiresAt: story.expiresAt,
  };

  const io = getIO();
  if (io) {
    io.emit('story:created', storyData);
  }

  return reply.status(201).send({
    success: true,
    story: storyData,
  });
}

export async function getActiveStories(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = (request as any).user?.userId;
  const now = new Date();

  // Find non-expired stories
  const stories = await Story.find({
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'displayName email avatarUrl isOnline')
    .lean();

  // Group stories by user
  const groupedByUser = new Map<string, any>();
  const myStories: any[] = [];

  for (const story of stories) {
    const storyUser: any = story.userId;
    if (!storyUser) continue;

    const uId = storyUser._id.toString();
    const isMe = uId === currentUserId;
    const isViewed = (story.viewers || []).some((v: any) => v.toString() === currentUserId);

    const formattedStory = {
      id: story._id.toString(),
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      viewersCount: (story.viewers || []).length,
      isViewed,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
    };

    if (isMe) {
      myStories.push(formattedStory);
    }

    if (!groupedByUser.has(uId)) {
      groupedByUser.set(uId, {
        userId: uId,
        displayName: storyUser.displayName,
        avatarUrl: storyUser.avatarUrl,
        isOnline: !!storyUser.isOnline,
        isMe,
        hasUnseen: !isViewed,
        stories: [formattedStory],
      });
    } else {
      const existing = groupedByUser.get(uId);
      existing.stories.push(formattedStory);
      if (!isViewed) {
        existing.hasUnseen = true;
      }
    }
  }

  const userStoryGroups = Array.from(groupedByUser.values());

  return reply.send({
    success: true,
    myStories,
    userStoryGroups,
  });
}

export async function viewStory(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { id } = request.params;

  const story = await Story.findById(id);
  if (!story) {
    return reply.status(404).send({ error: 'Story not found' });
  }

  const alreadyViewed = story.viewers.some((v) => v.toString() === currentUserId);
  if (!alreadyViewed) {
    story.viewers.push(new Types.ObjectId(currentUserId));
    await story.save();
  }

  return reply.send({
    success: true,
    viewersCount: story.viewers.length,
  });
}

export async function deleteStory(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const currentUserId = (request as any).user.userId;
  const { id } = request.params;

  const story = await Story.findOne({
    _id: id,
    userId: new Types.ObjectId(currentUserId),
  });

  if (!story) {
    return reply.status(404).send({ error: 'Story not found or you are not the owner' });
  }

  await story.deleteOne();

  const io = getIO();
  if (io) {
    io.emit('story:deleted', { storyId: id, userId: currentUserId });
  }

  return reply.send({
    success: true,
    message: 'Story deleted successfully',
  });
}
