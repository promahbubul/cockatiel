import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Phone,
  Video,
  Plus,
  Smile,
  ArrowUp,
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { MOCK_CONVERSATION_EMMA, CURRENT_USER } from '../../src/constants/mockData';
import { Message } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { MessageBubble } from '../../src/components/MessageBubble';

export default function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>(MOCK_CONVERSATION_EMMA);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId: String(id || 'chat_1'),
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      senderAvatar: CURRENT_USER.avatar,
      text: inputText.trim(),
      timestamp: 'Just now',
      isOutgoing: true,
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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

        <View style={styles.headerUser}>
          <Avatar
            uri="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80"
            size={40}
            isOnline={true}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>Emma Watson</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Phone size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Video size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.dateSeparator}>
              <View style={styles.datePill}>
                <Text style={styles.dateText}>TODAY</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Bottom Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Plus size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={styles.emojiButton} activeOpacity={0.7}>
              <Smile size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length > 0 && styles.sendButtonActive,
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <ArrowUp size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    paddingRight: 6,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  keyboardContainer: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 14,
  },
  datePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 44,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  emojiButton: {
    padding: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
});
