import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { MOCK_CONTACTS } from '../../src/constants/mockData';
import { SearchBar } from '../../src/components/SearchBar';
import { ContactListItem } from '../../src/components/ContactListItem';

const ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

export default function ContactsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = MOCK_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.statusText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group contacts by section
  const sections = ALPHABET.map((letter) => ({
    title: letter,
    data: filteredContacts.filter((c) => c.section === letter),
  })).filter((sec) => sec.data.length > 0 || !searchQuery);

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
          <UserPlus size={20} color={COLORS.text} />
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
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ContactListItem
              contact={item}
              onPress={() => router.push(`/conversation/chat_${item.id}`)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        {/* Right Alphabet Scrubber */}
        <View style={styles.alphabetIndex}>
          {ALPHABET.map((letter) => (
            <TouchableOpacity key={letter} style={styles.alphabetLetterButton}>
              <Text style={styles.alphabetLetterText}>{letter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
    marginBottom: 8,
  },
  listWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  alphabetIndex: {
    position: 'absolute',
    right: 8,
    top: 20,
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alphabetLetterButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  alphabetLetterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
