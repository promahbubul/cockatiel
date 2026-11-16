import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ContactItem } from '../types';
import { Avatar } from './Avatar';
import { COLORS } from '../constants/theme';

interface ContactListItemProps {
  contact: ContactItem;
  onPress?: () => void;
}

export const ContactListItem: React.FC<ContactListItemProps> = ({
  contact,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar uri={contact.avatar} size={50} isOnline={contact.isOnline} />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {contact.name}
        </Text>
        <Text style={styles.status} numberOfLines={1}>
          {contact.statusText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  status: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
