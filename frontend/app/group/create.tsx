import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Check, X } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { ACTIVE_STORIES } from '../../src/constants/mockData';

export default function CreateGroupScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(ACTIVE_STORIES.slice(0, 3));

  const removeMember = (id: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreate = () => {
    if (!groupName.trim()) return;
    router.replace('/conversation/chat_4');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!groupName.trim()}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.createActionText,
              groupName.trim().length > 0 && styles.createActionTextActive,
            ]}
          >
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Photo & Name row */}
        <View style={styles.groupInfoRow}>
          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8}>
            <Camera size={26} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.nameInputContainer}>
            <TextInput
              style={styles.nameInput}
              placeholder="Group name"
              placeholderTextColor={COLORS.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
            />
          </View>
        </View>

        {/* Selected Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            MEMBERS ({selectedMembers.length})
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {selectedMembers.map((member) => (
              <View key={member.id} style={styles.memberChip}>
                <Image source={{ uri: member.avatar }} style={styles.chipAvatar} />
                <Text style={styles.chipName} numberOfLines={1}>
                  {member.name}
                </Text>
                <TouchableOpacity
                  style={styles.removeChipButton}
                  onPress={() => removeMember(member.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  createActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  createActionTextActive: {
    color: COLORS.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  groupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nameInputContainer: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 6,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  membersSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  memberChip: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    width: 60,
  },
  chipAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 6,
  },
  chipName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  removeChipButton: {
    position: 'absolute',
    top: -2,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
