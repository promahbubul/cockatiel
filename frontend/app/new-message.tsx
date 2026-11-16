import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, UserPlus } from 'lucide-react-native';
import { COLORS } from '../src/constants/theme';
import { ACTIVE_STORIES } from '../src/constants/mockData';
import { SearchBar } from '../src/components/SearchBar';
import { Avatar } from '../src/components/Avatar';

export default function NewMessageScreen() {
  const router = useRouter();
  const [recipientQuery, setRecipientQuery] = useState('');

  const suggestedContacts = [
    { id: '1', name: 'Emma Watson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' },
    { id: '2', name: 'Lucas Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
    { id: '3', name: 'Mia Wong', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Message</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Input */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="To: Name or Number"
          value={recipientQuery}
          onChangeText={setRecipientQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Quick Action Rows */}
        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
          <View style={styles.actionIconContainer}>
            <Users size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Create New Group</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
          <View style={styles.actionIconContainer}>
            <UserPlus size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Add New Contact</Text>
        </TouchableOpacity>

        {/* Suggested Section */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>SUGGESTED</Text>
        </View>

        {suggestedContacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactRow}
            onPress={() => {
              router.back();
              router.push(`/conversation/chat_${contact.id}`);
            }}
            activeOpacity={0.7}
          >
            <Avatar uri={contact.avatar} size={50} />
            <Text style={styles.contactName}>{contact.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 14,
  },
});
