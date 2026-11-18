import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { MOCK_CONTACTS } from '../../src/constants/mockData';
import { SearchBar } from '../../src/components/SearchBar';
import { ContactListItem } from '../../src/components/ContactListItem';
import { api } from '../../src/services/api';
import { ContactItem } from '../../src/types';

export default function ContactsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<ContactItem[]>(MOCK_CONTACTS);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await api.users.getContacts();
      if (res.success && res.contacts && res.contacts.length > 0) {
        const mapped: ContactItem[] = res.contacts.map((c: any) => ({
          id: c.id,
          name: c.displayName,
          avatar: c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          statusText: c.about || 'Available',
          isOnline: !!c.isOnline,
          section: (c.displayName?.[0] || '#').toUpperCase(),
        }));
        setContacts(mapped);
      }
    } catch {
      // Keep mock contacts if backend is starting
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  };

  const handleStartChat = async (contact: ContactItem) => {
    try {
      const res = await api.chats.createDirect(contact.id);
      if (res.success && res.chat) {
        router.push(`/conversation/${res.chat.id}`);
        return;
      }
    } catch {
      // Fallback
    }
    router.push(`/conversation/chat_${contact.id}`);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.statusText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group contacts by section dynamically
  const letters = Array.from(new Set(filteredContacts.map((c) => c.section))).sort();
  const sections = letters.map((letter) => ({
    title: letter,
    data: filteredContacts.filter((c) => c.section === letter),
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/new-message')}
          activeOpacity={0.8}
        >
          <UserPlus size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search contacts"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Main Content with Alphabet Scrubber */}
      <View style={styles.listWrapper}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContactListItem
              contact={item}
              onPress={() => handleStartChat(item)}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD6C4',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  listWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
