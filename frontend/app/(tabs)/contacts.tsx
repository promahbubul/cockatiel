import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserPlus, Search } from 'lucide-react-native';
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
  const [searchResults, setSearchResults] = useState<ContactItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

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

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.users.search(text.trim());
        if (res.success && res.users) {
          const mapped: ContactItem[] = res.users.map((u: any) => ({
            id: u.id,
            name: u.displayName,
            avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            statusText: u.about || u.email,
            isOnline: !!u.isOnline,
            section: (u.displayName?.[0] || '#').toUpperCase(),
          }));
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error('Contact search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
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

  const isQueryActive = searchQuery.trim().length > 0;

  // If search query is active and we have backend search results, merge unique items
  let activeList: ContactItem[];
  if (isQueryActive) {
    const localMatches = contacts.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.statusText.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const seenIds = new Set(localMatches.map((c) => c.id));
    const newFromSearch = searchResults.filter((r) => !seenIds.has(r.id));
    activeList = [...localMatches, ...newFromSearch];
  } else {
    activeList = contacts;
  }

  // Group contacts by section dynamically
  const letters = Array.from(new Set(activeList.map((c) => c.section))).sort();
  const sections = letters.map((letter) => ({
    title: letter,
    data: activeList.filter((c) => c.section === letter),
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
          placeholder="Search contacts & users"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {isSearching && (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={{ position: 'absolute', right: 30, top: 12 }}
          />
        )}
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
