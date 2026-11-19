import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { CheckCheck } from 'lucide-react-native';
import { Message } from '../types';
import { COLORS } from '../constants/theme';
import { Avatar } from './Avatar';
import { VoiceNotePlayer } from './VoiceNotePlayer';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  onImagePress?: (uri: string) => void;
  onLongPress?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = true,
  onImagePress,
  onLongPress,
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
        <TouchableOpacity
          activeOpacity={0.92}
          delayLongPress={280}
          onLongPress={() => onLongPress?.(message)}
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

          {message.audioUrl && (
            <VoiceNotePlayer audioUrl={message.audioUrl} isOutgoing={isOutgoing} />
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
              <CheckCheck size={14} color="#FEF3C7" style={styles.checkIcon} />
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
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 5,
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
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  // Feather-arch incoming bubble: soft warm cream with delicate outline
  incomingBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DD',
    borderTopLeftRadius: 5,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // Feather-arch outgoing bubble: rich cockatiel sunset coral
  outgoingBubble: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 2,
  },
  mediaBubble: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },
  imageWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 6,
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
    paddingHorizontal: 4,
  },
  incomingText: {
    color: COLORS.text,
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
    color: COLORS.textSecondary,
  },
  timestampOutgoing: {
    color: '#FFE2D5',
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
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E5DD',
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
