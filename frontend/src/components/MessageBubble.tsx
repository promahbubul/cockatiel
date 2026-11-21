import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { CheckCheck, PhoneCall, PhoneMissed, Video, VideoOff } from 'lucide-react-native';
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
          {/* Quoted Reply Block */}
          {Boolean(message.replyTo) && (
            <View
              style={[
                styles.quotedContainer,
                isOutgoing ? styles.quotedOutgoing : styles.quotedIncoming,
              ]}
            >
              <View
                style={[
                  styles.quotedAccentBar,
                  isOutgoing ? { backgroundColor: '#FBBF24' } : { backgroundColor: COLORS.primary },
                ]}
              />
              <View style={styles.quotedContent}>
                <Text
                  style={[
                    styles.quotedSender,
                    isOutgoing ? { color: '#FEF3C7' } : { color: COLORS.primary },
                  ]}
                  numberOfLines={1}
                >
                  {message.replyTo?.senderName}
                </Text>
                <Text
                  style={[
                    styles.quotedText,
                    isOutgoing ? { color: '#FFF2EB' } : { color: COLORS.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {message.replyTo?.text || (message.replyTo?.mediaType ? `[${message.replyTo.mediaType}]` : 'Original message')}
                </Text>
              </View>
            </View>
          )}

          {Boolean(message.imageUrl) && (
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => onImagePress?.(message.imageUrl!)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: message.imageUrl }} style={styles.mediaImage} />
            </TouchableOpacity>
          )}

          {Boolean(message.audioUrl) && (
            <VoiceNotePlayer audioUrl={message.audioUrl!} isOutgoing={isOutgoing} />
          )}

          {Boolean(message.caption) && (
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

          {Boolean(message.text) && (
            Boolean(message.text?.startsWith('📞') || message.text?.startsWith('📹')) ? (
              <View style={styles.callLogCard}>
                <View
                  style={[
                    styles.callIconBox,
                    message.text?.includes('Missed')
                      ? styles.callIconBoxMissed
                      : (isOutgoing ? styles.callIconBoxOutgoing : styles.callIconBoxIncoming),
                  ]}
                >
                  {message.text?.includes('Missed') ? (
                    message.text?.startsWith('📹') ? (
                      <VideoOff size={18} color="#EF4444" />
                    ) : (
                      <PhoneMissed size={18} color="#EF4444" />
                    )
                  ) : message.text?.startsWith('📹') ? (
                    <Video size={18} color={isOutgoing ? '#FED7AA' : '#10B981'} />
                  ) : (
                    <PhoneCall size={18} color={isOutgoing ? '#FED7AA' : '#10B981'} />
                  )}
                </View>
                <View style={styles.callLogDetails}>
                  <Text
                    style={[
                      styles.callLogTitle,
                      isOutgoing ? styles.outgoingText : styles.incomingText,
                      message.text?.includes('Missed') && { color: isOutgoing ? '#FCA5A5' : '#EF4444' },
                    ]}
                  >
                    {message.text?.includes('Missed')
                      ? message.text?.startsWith('📹') ? 'Missed video call' : 'Missed audio call'
                      : message.text?.startsWith('📹') ? 'Video call' : 'Audio call'}
                  </Text>
                  <Text
                    style={[
                      styles.callLogSubtitle,
                      isOutgoing ? { color: '#FFE4D6' } : { color: COLORS.textSecondary },
                    ]}
                  >
                    {message.text?.replace(/^[📞📹]\s*/, '')}
                  </Text>
                </View>
              </View>
            ) : Boolean(message.mediaUrl && message.text?.startsWith('📄')) ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(message.mediaUrl!)}
                style={styles.documentCard}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.messageText,
                    isOutgoing ? styles.outgoingText : styles.incomingText,
                    styles.documentText,
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.tapToOpenText,
                    isOutgoing ? { color: '#FED7AA' } : { color: COLORS.primary },
                  ]}
                >
                  Tap to view document ↗
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={[
                  styles.messageText,
                  isOutgoing ? styles.outgoingText : styles.incomingText,
                ]}
              >
                {message.text}
              </Text>
            )
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
            {Boolean(isOutgoing && message.isRead) && (
              <CheckCheck size={14} color="#FEF3C7" style={styles.checkIcon} />
            )}
          </View>

          {/* Reactions badge */}
          {Boolean(message.reactions && message.reactions.length > 0) && (
            <View
              style={[
                styles.reactionBadge,
                isOutgoing ? styles.reactionBadgeOutgoing : styles.reactionBadgeIncoming,
              ]}
            >
              {message.reactions!.map((r, idx) => (
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
  documentCard: {
    paddingVertical: 2,
  },
  documentText: {
    fontWeight: '700',
  },
  tapToOpenText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  quotedContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
    paddingVertical: 4,
    paddingRight: 8,
  },
  quotedOutgoing: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  quotedIncoming: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  quotedAccentBar: {
    width: 3.5,
    borderRadius: 2,
    marginRight: 8,
  },
  quotedContent: {
    flex: 1,
    justifyContent: 'center',
  },
  quotedSender: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 1,
  },
  quotedText: {
    fontSize: 12,
    lineHeight: 16,
  },
  callLogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 10,
    minWidth: 160,
  },
  callIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIconBoxMissed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  callIconBoxOutgoing: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  callIconBoxIncoming: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  callLogDetails: {
    flex: 1,
  },
  callLogTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  callLogSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});
