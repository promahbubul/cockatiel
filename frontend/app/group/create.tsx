import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Check, X } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { api } from '../../src/services/api';

export default function CreateGroupScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await api.users.getContacts();
        if (res.success && res.contacts) {
          setContacts(res.contacts);
          // Default select first two contacts if available
          if (res.contacts.length > 0) {
            setSelectedIds(res.contacts.slice(0, 2).map((c: any) => c.id));
          }
        }
      } catch (err) {
        console.error('Failed to load contacts for group creation:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadContacts();
  }, []);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Required', 'Please enter a group name');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('Required', 'Please select at least one member');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.chats.createGroup(groupName.trim(), selectedIds);
      if (res.success && res.chat) {
        router.replace(`/conversation/${res.chat.id}`);
        return;
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMembers = contacts.filter((c) => selectedIds.includes(c.id));

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
          disabled={!groupName.trim() || selectedIds.length === 0 || isSubmitting}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text
              style={[
                styles.createActionText,
                groupName.trim().length > 0 && selectedIds.length > 0 && styles.createActionTextActive,
              ]}
            >
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Photo & Name row */}
        <View style={styles.groupInfoRow}>
          <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8}>
            <Camera size={24} color={COLORS.primary} />
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
        {selectedMembers.length > 0 && (
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>
              MEMBERS ({selectedMembers.length})
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {selectedMembers.map((member) => (
                <View key={member.id} style={styles.memberChip}>
                  <Image
                    source={{ uri: member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                    style={styles.chipAvatar}
                  />
                  <Text style={styles.chipName} numberOfLines={1}>
                    {member.displayName}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeChipButton}
                    onPress={() => toggleMember(member.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={12} color="#FFFFFF" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Pick Contacts List */}
        <View style={styles.contactsListSection}>
          <Text style={styles.sectionTitle}>SELECT CONTACTS</Text>
          {isLoading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            contacts.map((contact) => {
              const isSelected = selectedIds.includes(contact.id);
              return (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactRow}
                  onPress={() => toggleMember(contact.id)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: contact.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                    style={styles.contactAvatar}
                  />
                  <View style={styles.contactTextContainer}>
                    <Text style={styles.contactName}>{contact.displayName}</Text>
                    <Text style={styles.contactEmail} numberOfLines={1}>
                      {contact.about || contact.email}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxActive,
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  createActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  createActionTextActive: {
    color: COLORS.primary, // Cockatiel Cheek Coral #FF6B35
  },
  content: {
    paddingBottom: 40,
  },
  groupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  nameInputContainer: {
    flex: 1,
  },
  nameInput: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 8,
  },
  membersSection: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
  },
  chipName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
    maxWidth: 90,
  },
  removeChipButton: {
    backgroundColor: COLORS.textSecondary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactsListSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary, // Cockatiel Cheek Coral
    borderColor: COLORS.primary,
  },
});
