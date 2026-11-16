import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Info } from 'lucide-react-native';
import { CallLogItem } from '../types';
import { Avatar } from './Avatar';
import { COLORS } from '../constants/theme';

interface CallListItemProps {
  call: CallLogItem;
  onPress?: () => void;
  onInfoPress?: () => void;
}

export const CallListItem: React.FC<CallListItemProps> = ({
  call,
  onPress,
  onInfoPress,
}) => {
  const isMissed = call.direction === 'missed';

  const renderIcon = () => {
    if (call.callType === 'video') {
      if (isMissed) {
        return <Video size={16} color={COLORS.missedCall} />;
      }
      return <Video size={16} color={call.direction === 'incoming' ? COLORS.incomingCall : COLORS.outgoingCall} />;
    } else {
      if (isMissed) {
        return <PhoneMissed size={16} color={COLORS.missedCall} />;
      }
      return <Phone size={16} color={call.direction === 'incoming' ? COLORS.incomingCall : COLORS.outgoingCall} />;
    }
  };

  const getSubtext = () => {
    if (isMissed) {
      return call.callType === 'video' ? 'Missed video call' : 'Missed call';
    }
    const typeLabel = call.direction === 'incoming' ? 'Incoming' : 'Outgoing';
    return call.duration ? `${typeLabel} (${call.duration})` : typeLabel;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar uri={call.avatar} size={54} />

      <View style={styles.center}>
        <Text style={[styles.name, isMissed && styles.missedName]} numberOfLines={1}>
          {call.name}
        </Text>
        <View style={styles.subRow}>
          {renderIcon()}
          <Text style={styles.subText}>{getSubtext()}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.timestamp}>{call.timestamp}</Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={onInfoPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Info size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  missedName: {
    color: COLORS.missedCall,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  infoButton: {
    padding: 2,
  },
});
