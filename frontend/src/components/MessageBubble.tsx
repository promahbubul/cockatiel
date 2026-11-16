import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { CheckCheck } from 'lucide-react-native';
import { Message } from '../types';
import { COLORS } from '../constants/theme';
import { Avatar } from './Avatar';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  onImagePress?: (uri: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = true,
  onImagePress,
}) => {
  const isOutgoing = message.isOutgoing;

  return (
    <View
      style={[
        styles.row,
        isOutgoing ? styles.outgoingRow : styles.incomingRow,
      ]}
    >
      {!isOutgoing && (
        <View style={styles.avatarContainer}>
          {showAvatar ? (
            <Avatar uri={message.senderAvatar} size={32} />
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>
      )}

      <View style={styles.bubbleContainer}>
        <View
          style={[
            styles.bubble,
            isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
            message.imageUrl ? styles.mediaBubble : null,
          ]}
        >
          {message.imageUrl && (
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => onImagePress?.(message.imageUrl!)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: message.imageUrl }} style={styles.mediaImage} />
            </TouchableOpacity>
          )}

          {message.caption && (
            <Text
              style={[
                styles.messageText,
                isOutgoing ? styles.outgoingText : styles.incomingText,
                styles.captionText,
              ]}
            >
              {message.caption}
            </Text>
          )}

          {message.text && (
            <Text
              style={[
                styles.messageText,
                isOutgoing ? styles.outgoingText : styles.incomingText,
              ]}
            >
              {message.text}
            </Text>
          )}

          {/* Timestamp and status row */}
          <View style={[styles.metaRow, isOutgoing ? styles.metaRowOutgoing : styles.metaRowIncoming]}>
            <Text
              style={[
                styles.timestamp,
                isOutgoing ? styles.timestampOutgoing : styles.timestampIncoming,
              ]}
            >
              {message.timestamp}
            </Text>
            {isOutgoing && message.isRead && (
              <CheckCheck size={14} color="#60A5FA" style={styles.checkIcon} />
            )}
          </View>

          {/* Reactions badge */}
          {message.reactions && message.reactions.length > 0 && (
            <View
              style={[
                styles.reactionBadge,
                isOutgoing ? styles.reactionBadgeOutgoing : styles.reactionBadgeIncoming,
              ]}
            >
              {message.reactions.map((r, idx) => (
                <Text key={idx} style={styles.reactionEmoji}>
                  {r.emoji}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  incomingRow: {
    justifyContent: 'flex-start',
  },
  outgoingRow: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  bubbleContainer: {
    maxWidth: '78%',
    position: 'relative',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  incomingBubble: {
    backgroundColor: '#F0F2F5',
    borderBottomLeftRadius: 6,
  },
  outgoingBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },
  mediaBubble: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  imageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  mediaImage: {
    width: 240,
    height: 160,
    resizeMode: 'cover',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  captionText: {
    paddingHorizontal: 6,
  },
  incomingText: {
    color: '#111827',
  },
  outgoingText: {
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaRowIncoming: {
    justifyContent: 'flex-start',
  },
  metaRowOutgoing: {
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
  },
  timestampIncoming: {
    color: '#9CA3AF',
  },
  timestampOutgoing: {
    color: '#E0E7FF',
  },
  checkIcon: {
    marginLeft: 4,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reactionBadgeIncoming: {
    right: -8,
  },
  reactionBadgeOutgoing: {
    left: -8,
  },
  reactionEmoji: {
    fontSize: 12,
  },
});
