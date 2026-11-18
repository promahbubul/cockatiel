import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Search, AlertCircle, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../src/constants/theme';
import { SearchBar } from '../src/components/SearchBar';
import { Avatar } from '../src/components/Avatar';
import { api } from '../src/services/api';

export default function NewMessageScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Fetch initial registered users / contacts
  useEffect(() => {
    let mounted = true;
    async function loadContacts() {
      try {
        const res = await api.users.getContacts();
        if (mounted && res.success && res.contacts) {
          setContacts(res.contacts);
        }
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        if (mounted) setIsLoadingContacts(false);
      }
    }
    loadContacts();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle live search
  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.users.search(text.trim());
        if (res.success && res.users) {
          setSearchResults(res.users);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Start chat with user
  const handleSelectUser = async (targetUser: any) => {
    setActionUserId(targetUser.id);
    try {
      const res = await api.chats.createDirect(targetUser.id);
      if (res.success && res.chat) {
        router.back();
        router.push(`/conversation/${res.chat.id}`);
        return;
      }
    } catch (err) {
      console.error('Create direct chat error:', err);
    } finally {
      setActionUserId(null);
    }
    // Fallback if network issue
    router.back();
    router.push(`/conversation/chat_${targetUser.id}`);
  };

  const isShowingSearch = query.trim().length > 0;
  const displayList = isShowingSearch ? searchResults : contacts;

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
          placeholder="Search by name or email..."
          value={query}
          onChangeText={handleQueryChange}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Quick Action Rows (only show when not searching) */}
        {!isShowingSearch && (
          <>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                router.back();
                router.push('/group/create');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Users size={22} color={COLORS.primary} />
              </View>
              <View style={styles.actionTextWrapper}>
                <Text style={styles.actionText}>Create New Group</Text>
                <Text style={styles.actionSubtext}>Chat together with multiple friends</Text>
              </View>
              <ArrowRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />
          </>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>
            {isShowingSearch ? 'SEARCH RESULTS' : 'PEOPLE ON COCKATIEL'}
          </Text>
          {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        {/* Loading state for contacts */}
        {isLoadingContacts && !isShowingSearch && (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Finding people...</Text>
          </View>
        )}

        {/* Empty search results */}
        {isShowingSearch && !isSearching && searchResults.length === 0 && (
          <View style={styles.emptyContainer}>
            <Search size={36} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>Try searching with a different name or full email address</Text>
          </View>
        )}

        {/* Contacts or Search Results List */}
        {displayList.map((item) => {
          const isActing = actionUserId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.contactRow, isActing && styles.contactRowActing]}
              onPress={() => handleSelectUser(item)}
              activeOpacity={0.7}
              disabled={isActing}
            >
              <Avatar
                uri={item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                size={50}
                isOnline={item.isOnline}
              />
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{item.displayName || item.name}</Text>
                <Text style={styles.contactEmail} numberOfLines={1}>
                  {item.about || item.email}
                </Text>
              </View>

              {isActing ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>Chat</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Feather Ivory #FAF9F6
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.primary, // Cockatiel Cheek Coral #FF6B35
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 32,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight, // #FFF2EB
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginTop: 14,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactRowActing: {
    opacity: 0.6,
  },
  contactDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chatBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chatBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
