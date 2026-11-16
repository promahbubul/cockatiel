import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SquarePen } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { ACTIVE_STORIES, MOCK_CHATS } from '../../src/constants/mockData';
import { SearchBar } from '../../src/components/SearchBar';
import { Avatar } from '../../src/components/Avatar';
import { ChatListItem } from '../../src/components/ChatListItem';

export default function ChatsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = MOCK_CHATS.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/new-message')}
          activeOpacity={0.8}
        >
          <SquarePen size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search chats"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stories / Online Active Avatars Strip */}
      <View style={styles.storiesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          {ACTIVE_STORIES.map((story) => (
            <TouchableOpacity
              key={story.id}
              style={styles.storyItem}
              onPress={() => router.push(`/conversation/chat_${story.id}`)}
              activeOpacity={0.7}
            >
              <Avatar
                uri={story.avatar}
                size={64}
                isOnline={story.isOnline}
                showStoryRing={story.isOnline}
              />
              <Text style={styles.storyName} numberOfLines={1}>
                {story.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chats List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            onPress={() => router.push(`/conversation/${item.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatListContent}
      />
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  storiesSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
    marginBottom: 8,
  },
  storiesContent: {
    paddingHorizontal: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 68,
  },
  storyName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  chatListContent: {
    paddingBottom: 24,
  },
});
