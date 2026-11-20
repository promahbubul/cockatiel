import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import {
  ChevronLeft,
  Phone,
  Video,
  Plus,
  Smile,
  ArrowUp,
  Mic,
  Trash2,
  Copy,
  Search,
  X,
  Camera,
  Image as ImageIcon,
  FileText,
  Reply,
  Pin,
  PinOff,
  Forward,
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { MOCK_CONVERSATION_EMMA, CURRENT_USER } from '../../src/constants/mockData';
import { Message } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';
import { MessageBubble } from '../../src/components/MessageBubble';
import { api } from '../../src/services/api';
import { socketService } from '../../src/services/socket';
import { useAuth } from '../../src/context/AuthContext';

const REACTION_EMOJIS = ['❤️', '🦜', '🔥', '👍', '😂', '😮'];

export default function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chatId = String(id || 'chat_1');
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>(MOCK_CONVERSATION_EMMA);
  const [chatInfo, setChatInfo] = useState<{
    title: string;
    avatarUrl: string;
    isOnline: boolean;
    lastSeen?: string;
  }>({
    title: 'Emma Watson',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    isOnline: true,
  });
  const [recipientId, setRecipientId] = useState<string | null>(null);

  const [inputText, setInputText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // In-chat search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Attachment Sheet state
  const [isAttachmentSheetVisible, setIsAttachmentSheetVisible] = useState(false);

  // Quoted Reply state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Pinned Message state
  const [pinnedMessage, setPinnedMessage] = useState<any>(null);

  // Forward Message state
  const [isForwardModalVisible, setIsForwardModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [forwardChats, setForwardChats] = useState<any[]>([]);
  const [forwardSearch, setForwardSearch] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingIntervalRef = useRef<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Join socket room
    socketService.joinChat(chatId);

    // Fetch chat info and message history if MongoDB ObjectId (24 chars) or real chat
    const loadChatData = async () => {
      try {
        if (chatId.length === 24) {
          const [chatRes, msgRes] = await Promise.all([
            api.chats.getById(chatId).catch(() => null),
            api.messages.getMessages(chatId).catch(() => null),
          ]);

          if (chatRes?.success && chatRes.chat) {
            if (chatRes.chat.pinnedMessage) {
              setPinnedMessage(chatRes.chat.pinnedMessage);
            }
            const other = chatRes.chat.participants?.find((p: any) => p.id !== user?.id);
            if (other) {
              setRecipientId(other.id);
              setChatInfo({
                title: chatRes.chat.title || other.displayName || 'Conversation',
                avatarUrl: chatRes.chat.avatarUrl || other.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                isOnline: !!other.isOnline,
                lastSeen: other.lastSeen,
              });
            } else {
              setChatInfo({
                title: chatRes.chat.title || 'Conversation',
                avatarUrl: chatRes.chat.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                isOnline: false,
              });
            }
          }

          if (msgRes?.success && msgRes.messages) {
            const mapped: Message[] = msgRes.messages.map((m: any) => ({
              id: m.id,
              chatId: m.chatId,
              senderId: m.senderId,
              senderName: m.senderName,
              senderAvatar: m.senderAvatar,
              text: m.content || '',
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isOutgoing: m.isMe,
              isRead: m.status === 'READ',
              reactions: m.reactions,
              imageUrl: m.mediaType === 'IMAGE' || m.mediaType === 'image' || (!m.mediaType && m.mediaUrl) ? m.mediaUrl : undefined,
              audioUrl: m.mediaType === 'AUDIO' ? m.mediaUrl : undefined,
              mediaUrl: m.mediaUrl,
              mediaType: m.mediaType,
              replyTo: m.replyTo,
            }));
            setMessages(mapped);
          }
        }
      } catch {
        // Fallback to mock conversation
      }
    };

    loadChatData();

    // Listen for incoming messages
    const unsubscribeMessage = socketService.onNewMessage((newMsg: any) => {
      if (newMsg.chatId === chatId) {
        const isAudio = newMsg.mediaType === 'AUDIO';
        const formatted: Message = {
          id: newMsg.id || `msg_${Date.now()}`,
          chatId: newMsg.chatId,
          senderId: newMsg.senderId,
          senderName: newMsg.senderName || 'User',
          senderAvatar: newMsg.senderAvatar,
          text: newMsg.content || newMsg.text || '',
          timestamp: 'Just now',
          isOutgoing: newMsg.senderId === user?.id,
          isRead: false,
          imageUrl: (newMsg.mediaType === 'IMAGE' || newMsg.mediaType === 'image' || (!newMsg.mediaType && !isAudio && newMsg.mediaUrl)) ? newMsg.mediaUrl : undefined,
          audioUrl: isAudio && newMsg.mediaUrl ? newMsg.mediaUrl : undefined,
          mediaUrl: newMsg.mediaUrl,
          mediaType: newMsg.mediaType,
          replyTo: newMsg.replyTo,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === formatted.id)) return prev;
          return [...prev, formatted];
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // Listen for real-time reactions
    const unsubMessageReact = socketService.onMessageReact((data) => {
      if (data.chatId === chatId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId ? { ...m, reactions: data.reactions } : m
          )
        );
      }
    });

    // Listen for deleted messages
    const unsubMessageDeleted = socketService.onMessageDeleted((data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    });

    // Listen for user online / offline status updates
    const unsubUserStatus = socketService.onUserStatus((data) => {
      setChatInfo((prev) => {
        return {
          ...prev,
          isOnline: data.isOnline,
          lastSeen: data.lastSeen,
        };
      });
    });

    // Listen for typing events
    const unsubTypingStart = socketService.onTypingStart((data) => {
      if (data.chatId === chatId && data.userId !== user?.id) {
        setIsOtherTyping(true);
      }
    });

    const unsubTypingStop = socketService.onTypingStop((data) => {
      if (data.chatId === chatId && data.userId !== user?.id) {
        setIsOtherTyping(false);
      }
    });

    // Pinned message listeners
    const socket = socketService.getSocket();
    const handlePinned = (data: any) => {
      if (data.chatId === chatId) {
        setPinnedMessage(data);
      }
    };
    const handleUnpinned = (data: any) => {
      if (data.chatId === chatId) {
        setPinnedMessage(null);
      }
    };
    if (socket) {
      socket.on('chat:pinned', handlePinned);
      socket.on('chat:unpinned', handleUnpinned);
    }

    return () => {
      socketService.leaveChat(chatId);
      unsubscribeMessage?.();
      unsubMessageReact?.();
      unsubMessageDeleted?.();
      unsubUserStatus?.();
      unsubTypingStart?.();
      unsubTypingStop?.();
      if (socket) {
        socket.off('chat:pinned', handlePinned);
        socket.off('chat:unpinned', handleUnpinned);
      }
      clearInterval(recordingIntervalRef.current);
    };
  }, [chatId, user?.id]);

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (user?.id) {
      socketService.sendTypingStart(chatId, user.id, user.displayName);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTypingStop(chatId, user.id);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const content = inputText.trim();
    setInputText('');

    const currentUserId = user?.id || CURRENT_USER.id;
    const currentUserName = user?.displayName || CURRENT_USER.name;
    const currentUserAvatar = user?.avatarUrl || CURRENT_USER.avatar;

    const activeReply = replyingTo
      ? {
          messageId: replyingTo.id,
          senderName: replyingTo.senderName,
          text: replyingTo.text || (replyingTo.imageUrl ? 'Photo 📷' : replyingTo.audioUrl ? 'Voice Note 🎙️' : 'Attachment'),
        }
      : undefined;

    setReplyingTo(null);

    const tempId = `msg_${Date.now()}`;
    const localMessage: Message = {
      id: tempId,
      chatId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      text: content,
      timestamp: 'Just now',
      isOutgoing: true,
      isRead: false,
      replyTo: activeReply,
    };

    setMessages((prev) => [...prev, localMessage]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Stop typing indicator immediately on send
    if (user?.id) {
      socketService.sendTypingStop(chatId, user.id);
    }

    try {
      if (chatId.length === 24) {
        const res = await api.messages.send({
          chatId,
          content,
          replyTo: activeReply,
        });

        if (res.success && res.message) {
          socketService.emitMessage(chatId, res.message);
        }
      } else {
        // Broadcast over socket for demo
        socketService.emitMessage(chatId, {
          id: tempId,
          chatId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          content,
          replyTo: activeReply,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // Local optimistic message already added
    }
  };

  const sendPickedImage = async (pickedUri: string) => {
    try {
      setIsUploadingMedia(true);

      const currentUserId = user?.id || CURRENT_USER.id;
      const currentUserName = user?.displayName || CURRENT_USER.name;
      const currentUserAvatar = user?.avatarUrl || CURRENT_USER.avatar;

      const tempId = `msg_${Date.now()}`;
      const localMessage: Message = {
        id: tempId,
        chatId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        text: '',
        imageUrl: pickedUri,
        timestamp: 'Uploading...',
        isOutgoing: true,
        isRead: false,
      };

      setMessages((prev) => [...prev, localMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Upload to Cloudinary folder 'cockatiel/chats'
      const uploadRes = await api.media.upload(pickedUri, 'cockatiel/chats');
      if (uploadRes.success && uploadRes.url) {
        if (chatId.length === 24) {
          const sendRes = await api.messages.send({
            chatId,
            mediaUrl: uploadRes.url,
            mediaType: 'image',
          });
          if (sendRes.success && sendRes.message) {
            socketService.emitMessage(chatId, sendRes.message);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId ? { ...m, imageUrl: uploadRes.url, timestamp: 'Just now' } : m
              )
            );
          }
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, imageUrl: uploadRes.url, timestamp: 'Just now' } : m
            )
          );
        }
      }
    } catch (err: any) {
      console.error('Pick and upload image error:', err);
      Alert.alert('Upload Failed', err.message || 'Could not upload image to Cloudinary');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handlePickCamera = async () => {
    setIsAttachmentSheetVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await sendPickedImage(result.assets[0].uri);
      }
    } catch (err: any) {
      console.error('Camera capture error:', err);
      Alert.alert('Camera Error', err.message || 'Failed to capture photo');
    }
  };

  const handlePickGallery = async () => {
    setIsAttachmentSheetVisible(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await sendPickedImage(result.assets[0].uri);
      }
    } catch (err: any) {
      console.error('Pick gallery error:', err);
      Alert.alert('Error', err.message || 'Failed to select photo');
    }
  };

  const handlePickDocument = async () => {
    setIsAttachmentSheetVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsUploadingMedia(true);

        const currentUserId = user?.id || CURRENT_USER.id;
        const currentUserName = user?.displayName || CURRENT_USER.name;
        const currentUserAvatar = user?.avatarUrl || CURRENT_USER.avatar;

        const docSizeMb = file.size ? ` (${(file.size / (1024 * 1024)).toFixed(1)} MB)` : '';
        const docText = `📄 ${file.name || 'Document'}${docSizeMb}`;

        const tempId = `msg_${Date.now()}`;
        const localMessage: Message = {
          id: tempId,
          chatId,
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          text: docText,
          timestamp: 'Uploading...',
          isOutgoing: true,
          isRead: false,
        };

        setMessages((prev) => [...prev, localMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        const uploadRes = await api.media.upload(file.uri, 'cockatiel/chats');
        if (uploadRes.success && uploadRes.url) {
          if (chatId.length === 24) {
            const sendRes = await api.messages.send({
              chatId,
              content: docText,
              mediaUrl: uploadRes.url,
              mediaType: 'document',
            });
            if (sendRes.success && sendRes.message) {
              socketService.emitMessage(chatId, sendRes.message);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempId ? { ...m, timestamp: 'Just now' } : m
                )
              );
            }
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId ? { ...m, timestamp: 'Just now' } : m
              )
            );
          }
        }
      }
    } catch (err: any) {
      console.error('Pick document error:', err);
      Alert.alert('Document Error', err.message || 'Could not send document');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Voice Note Recording Handlers
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required to record voice notes');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start voice recording:', err);
      Alert.alert('Recording Error', err.message || 'Could not access microphone');
    }
  };

  const cancelRecording = async () => {
    try {
      clearInterval(recordingIntervalRef.current);
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (err) {
      console.error('Cancel recording error:', err);
    } finally {
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const stopAndSendRecording = async () => {
    try {
      clearInterval(recordingIntervalRef.current);
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      const recordedDuration = recordingDuration;
      setRecordingDuration(0);

      if (!uri) return;

      const currentUserId = user?.id || CURRENT_USER.id;
      const currentUserName = user?.displayName || CURRENT_USER.name;
      const currentUserAvatar = user?.avatarUrl || CURRENT_USER.avatar;

      const tempId = `msg_${Date.now()}`;
      const localMessage: Message = {
        id: tempId,
        chatId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        text: '',
        audioUrl: uri,
        audioDuration: recordedDuration,
        timestamp: 'Uploading...',
        isOutgoing: true,
        isRead: false,
      };

      setMessages((prev) => [...prev, localMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Upload to Cloudinary folder 'cockatiel/voice'
      const uploadRes = await api.media.upload(uri, 'cockatiel/voice');
      if (uploadRes.success && uploadRes.url) {
        if (chatId.length === 24) {
          const sendRes = await api.messages.send({
            chatId,
            mediaUrl: uploadRes.url,
            mediaType: 'AUDIO',
          });
          if (sendRes.success && sendRes.message) {
            socketService.emitMessage(chatId, {
              ...sendRes.message,
              mediaType: 'AUDIO',
            });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId ? { ...m, audioUrl: uploadRes.url, timestamp: 'Just now' } : m
              )
            );
          }
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, audioUrl: uploadRes.url, timestamp: 'Just now' } : m
            )
          );
        }
      }
    } catch (err: any) {
      console.error('Error sending voice recording:', err);
      Alert.alert('Upload Failed', err.message || 'Could not send voice note');
    }
  };

  // Emoji Reaction Handler
  const handleSelectReaction = async (emoji: string) => {
    if (!selectedMessage) return;
    const msgId = selectedMessage.id;
    setSelectedMessage(null);

    // Optimistically update reactions
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const currentReactions = m.reactions ? [...m.reactions] : [];
          const existingIdx = currentReactions.findIndex(
            (r) => r.userId === (user?.id || 'me')
          );
          if (existingIdx >= 0) {
            currentReactions[existingIdx] = { userId: user?.id || 'me', emoji };
          } else {
            currentReactions.push({ userId: user?.id || 'me', emoji });
          }
          return { ...m, reactions: currentReactions };
        }
        return m;
      })
    );

    if (msgId.length === 24) {
      try {
        await api.messages.react(msgId, emoji);
      } catch (err) {
        console.error('React error:', err);
      }
    }
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Offline';
    const diffMs = Date.now() - new Date(lastSeen).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Active just now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    return 'Offline';
  };

  const handleDeleteMessage = async (messageId: string, forEveryone: boolean = false) => {
    setSelectedMessage(null);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    if (messageId.length === 24) {
      try {
        await api.messages.delete(messageId, forEveryone);
      } catch (err) {
        console.error('Delete message error:', err);
      }
    }
  };

  const handlePinMessage = async (msg: Message) => {
    setSelectedMessage(null);
    const pinPayload = {
      messageId: msg.id,
      text: msg.text || (msg.imageUrl ? 'Photo 📷' : msg.audioUrl ? 'Voice Note 🎙️' : 'Attachment'),
      senderName: msg.senderName,
    };
    setPinnedMessage({ ...pinPayload, chatId });
    if (chatId.length === 24) {
      try {
        await api.chats.pinMessage(chatId, pinPayload);
      } catch (err: any) {
        Alert.alert('Pin Error', err.message || 'Could not pin message');
      }
    }
  };

  const handleUnpinMessage = async () => {
    setPinnedMessage(null);
    if (chatId.length === 24) {
      try {
        await api.chats.unpinMessage(chatId);
      } catch (err: any) {
        Alert.alert('Unpin Error', err.message || 'Could not unpin message');
      }
    }
  };

  const handleOpenForward = async (msg: Message) => {
    setSelectedMessage(null);
    setMessageToForward(msg);
    setIsForwardModalVisible(true);
    setForwardSearch('');
    try {
      const res = await api.chats.getChats();
      if (res.success && res.chats) {
        setForwardChats(res.chats);
      }
    } catch (err) {
      console.error('Fetch chats for forward error:', err);
    }
  };

  const handleConfirmForward = async (targetChat: any) => {
    if (!messageToForward) return;
    try {
      setIsForwarding(true);
      const targetChatId = targetChat.id || targetChat._id;
      const targetName = targetChat.name || targetChat.title || 'Conversation';
      const payload: any = {
        chatId: targetChatId,
      };
      if (messageToForward.text) {
        payload.content = messageToForward.text;
      }
      if (messageToForward.imageUrl) {
        payload.mediaUrl = messageToForward.imageUrl;
        payload.mediaType = 'image';
      } else if (messageToForward.audioUrl) {
        payload.mediaUrl = messageToForward.audioUrl;
        payload.mediaType = 'AUDIO';
      } else if (messageToForward.mediaUrl) {
        payload.mediaUrl = messageToForward.mediaUrl;
        payload.mediaType = messageToForward.mediaType || 'file';
      }

      if (targetChatId.length === 24) {
        const res = await api.messages.send(payload);
        if (res.success && res.message) {
          socketService.emitMessage(targetChatId, res.message);
        }
      }

      setIsForwardModalVisible(false);
      setMessageToForward(null);
      Alert.alert('Forwarded', `Message forwarded to ${targetName}`);
    } catch (err: any) {
      Alert.alert('Forward Error', err.message || 'Could not forward message');
    } finally {
      setIsForwarding(false);
    }
  };

  const handleStartCall = (callType: 'audio' | 'video') => {
    const roomName = `call_${Date.now()}`;
    const targetUserId = recipientId || (chatId.startsWith('chat_') ? chatId.replace('chat_', '') : '');

    if (targetUserId && user?.id) {
      socketService.initiateCall({
        toUserId: targetUserId,
        caller: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        callType,
        roomName,
      });
    }

    router.push({
      pathname: '/call/ringing',
      params: {
        name: chatInfo.title,
        avatar: chatInfo.avatarUrl,
        type: callType,
        isIncoming: 'false',
        toUserId: targetUserId,
        roomName,
      },
    });
  };

  const displayMessages =
    isSearchOpen && searchQuery.trim()
      ? messages.filter((m) =>
          m.text?.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
      : messages;

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

        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => router.push(`/chat-info/${chatId}`)}
          activeOpacity={0.8}
        >
          <Avatar
            uri={chatInfo.avatarUrl}
            size={40}
            isOnline={chatInfo.isOnline}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{chatInfo.title}</Text>
            <Text style={[styles.headerStatus, chatInfo.isOnline && styles.headerStatusOnline]}>
              {isOtherTyping
                ? 'Typing...'
                : chatInfo.isOnline
                ? '● Active now'
                : formatLastSeen(chatInfo.lastSeen)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => {
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            }}
            activeOpacity={0.7}
          >
            <Search size={21} color={isSearchOpen ? COLORS.primary : COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => handleStartCall('audio')}
            activeOpacity={0.7}
          >
            <Phone size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => handleStartCall('video')}
            activeOpacity={0.7}
          >
            <Video size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* In-Chat Search Bar */}
      {isSearchOpen && (
        <View style={styles.inChatSearchContainer}>
          <View style={styles.inChatSearchBar}>
            <Search size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.inChatSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search in this chat..."
              placeholderTextColor={COLORS.textSecondary}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <View style={styles.searchCountBadge}>
                <Text style={styles.searchCountText}>
                  {displayMessages.length} {displayMessages.length === 1 ? 'match' : 'matches'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => {
                if (searchQuery.length > 0) {
                  setSearchQuery('');
                } else {
                  setIsSearchOpen(false);
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 6 }}
            >
              <X size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <View style={styles.pinnedBanner}>
          <TouchableOpacity
            style={styles.pinnedLeft}
            onPress={() => {
              const targetId = pinnedMessage.messageId || pinnedMessage.id;
              const idx = displayMessages.findIndex((m) => m.id === targetId);
              if (idx >= 0) {
                flatListRef.current?.scrollToIndex({ index: idx, animated: true });
              } else {
                Alert.alert(
                  'Pinned Message',
                  `${pinnedMessage.senderName}: ${pinnedMessage.text}`
                );
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.pinnedIconCircle}>
              <Pin size={13} color="#D97706" />
            </View>
            <View style={styles.pinnedTextCol}>
              <Text style={styles.pinnedSender} numberOfLines={1}>
                Pinned Message • {pinnedMessage.senderName}
              </Text>
              <Text style={styles.pinnedText} numberOfLines={1}>
                {pinnedMessage.text}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUnpinMessage}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.unpinBtn}
          >
            <X size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.dateSeparator}>
              <View style={styles.datePill}>
                <Text style={styles.dateText}>TODAY</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onImagePress={(uri) =>
                router.push({
                  pathname: '/media-viewer',
                  params: {
                    uri,
                    senderName: item.senderName,
                    timestamp: item.timestamp,
                    caption: item.caption || item.text || '',
                  },
                })
              }
              onLongPress={(msg) => setSelectedMessage(msg)}
            />
          )}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isSearchOpen && searchQuery.trim() ? (
              <View style={styles.emptySearchBox}>
                <Search size={32} color={COLORS.textSecondary} style={{ marginBottom: 8 }} />
                <Text style={styles.emptySearchTitle}>No messages found</Text>
                <Text style={styles.emptySearchSubtitle}>
                  No messages matching "{searchQuery}" in this flock chat.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyConversationContainer}>
                <Avatar uri={chatInfo.avatarUrl} size={80} isOnline={chatInfo.isOnline} />
                <Text style={styles.emptyConversationTitle}>{chatInfo.title}</Text>
                <Text style={styles.emptyConversationSubtitle}>
                  Wave hello and start your conversation with {chatInfo.title}! 🦜
                </Text>
              </View>
            )
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Quoted Reply Preview Bar */}
        {replyingTo && (
          <View style={styles.replyPreviewBar}>
            <View style={styles.replyAccentLine} />
            <View style={styles.replyPreviewContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Reply size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.replyPreviewSender}>
                  Replying to {replyingTo.senderName}
                </Text>
              </View>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replyingTo.text || (replyingTo.imageUrl ? 'Photo 📷' : replyingTo.audioUrl ? 'Voice Note 🎙️' : 'Attachment')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setReplyingTo(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.replyCancelBtn}
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Input / Voice Recording Bar */}
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <TouchableOpacity
              style={styles.cancelRecordingButton}
              onPress={cancelRecording}
              activeOpacity={0.7}
            >
              <Trash2 size={22} color="#EF4444" />
            </TouchableOpacity>

            <View style={styles.recordingStatus}>
              <View style={styles.recordingPulsingDot} />
              <Text style={styles.recordingTimerText}>
                {formatRecordingTime(recordingDuration)}
              </Text>
              <Text style={styles.recordingLabel}>Recording voice...</Text>
            </View>

            <TouchableOpacity
              style={styles.sendRecordingButton}
              onPress={stopAndSendRecording}
              activeOpacity={0.8}
            >
              <ArrowUp size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setIsAttachmentSheetVisible(true)}
              disabled={isUploadingMedia}
              activeOpacity={0.7}
            >
              {isUploadingMedia ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Plus size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.textSecondary}
                value={inputText}
                onChangeText={handleInputChange}
                multiline
              />
              <TouchableOpacity style={styles.emojiButton} activeOpacity={0.7}>
                <Smile size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                style={[styles.sendButton, styles.sendButtonActive]}
                onPress={handleSend}
                activeOpacity={0.8}
              >
                <ArrowUp size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.micButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <Mic size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Floating Reaction & Message Action Bar Modal */}
      {selectedMessage && (
        <Modal
          transparent
          animationType="fade"
          visible={!!selectedMessage}
          onRequestClose={() => setSelectedMessage(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedMessage(null)}
          >
            <View style={styles.reactionBarContainer}>
              <View style={styles.reactionBar}>
                {REACTION_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.reactionItem}
                    onPress={() => handleSelectReaction(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reactionBarEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message Action Options */}
              <View style={styles.messageActionCard}>
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => {
                    const toReply = selectedMessage;
                    setSelectedMessage(null);
                    setReplyingTo(toReply);
                  }}
                  activeOpacity={0.7}
                >
                  <Reply size={18} color={COLORS.primary} />
                  <Text style={styles.actionMenuText}>Reply</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => selectedMessage && handleOpenForward(selectedMessage)}
                  activeOpacity={0.7}
                >
                  <Forward size={18} color="#059669" />
                  <Text style={styles.actionMenuText}>Forward</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => {
                    const targetId = pinnedMessage?.messageId || pinnedMessage?.id;
                    if (targetId === selectedMessage.id) {
                      handleUnpinMessage();
                      setSelectedMessage(null);
                    } else {
                      handlePinMessage(selectedMessage);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {(pinnedMessage?.messageId || pinnedMessage?.id) === selectedMessage.id ? (
                    <>
                      <PinOff size={18} color="#D97706" />
                      <Text style={styles.actionMenuText}>Unpin Message</Text>
                    </>
                  ) : (
                    <>
                      <Pin size={18} color="#D97706" />
                      <Text style={styles.actionMenuText}>Pin Message</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => handleDeleteMessage(selectedMessage.id, false)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color="#EF4444" />
                  <Text style={styles.actionMenuDangerText}>Delete for Me</Text>
                </TouchableOpacity>

                {selectedMessage.isOutgoing && (
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleDeleteMessage(selectedMessage.id, true)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color="#DC2626" />
                    <Text style={[styles.actionMenuDangerText, { fontWeight: '800' }]}>
                      Delete for Everyone
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedMessage.text ? (
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => {
                      setSelectedMessage(null);
                      Alert.alert('Copied', 'Message text copied to clipboard');
                    }}
                    activeOpacity={0.7}
                  >
                    <Copy size={18} color={COLORS.text} />
                    <Text style={styles.actionMenuText}>Copy Text</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Attachment Action Sheet */}
      <Modal visible={isAttachmentSheetVisible} animationType="fade" transparent>
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setIsAttachmentSheetVisible(false)}
        >
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Share Content</Text>

            <View style={styles.sheetGrid}>
              {/* Camera */}
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={handlePickCamera}
                activeOpacity={0.8}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#FFF2EB' }]}>
                  <Camera size={26} color={COLORS.primary} />
                </View>
                <Text style={styles.sheetItemLabel}>Camera</Text>
              </TouchableOpacity>

              {/* Gallery */}
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={handlePickGallery}
                activeOpacity={0.8}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <ImageIcon size={26} color="#D97706" />
                </View>
                <Text style={styles.sheetItemLabel}>Photos</Text>
              </TouchableOpacity>

              {/* Document */}
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={handlePickDocument}
                activeOpacity={0.8}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <FileText size={26} color="#0284C7" />
                </View>
                <Text style={styles.sheetItemLabel}>Document</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setIsAttachmentSheetVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Forward Message Modal */}
      <Modal visible={isForwardModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.forwardOverlay}
        >
          <View style={styles.forwardContainer}>
            <View style={styles.forwardHeader}>
              <Text style={styles.forwardTitle}>Forward Message to...</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsForwardModalVisible(false);
                  setMessageToForward(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Preview of message being forwarded */}
            {messageToForward && (
              <View style={styles.forwardPreviewBar}>
                <Text style={styles.forwardPreviewLabel}>Forwarding:</Text>
                <Text style={styles.forwardPreviewSnippet} numberOfLines={1}>
                  {messageToForward.text ||
                    (messageToForward.imageUrl
                      ? 'Photo 📷'
                      : messageToForward.audioUrl
                      ? 'Voice Note 🎙️'
                      : 'Attachment 📎')}
                </Text>
              </View>
            )}

            {/* Search Input for target chats */}
            <View style={styles.forwardSearchBox}>
              <Search size={16} color={COLORS.textSecondary} />
              <TextInput
                style={styles.forwardSearchInput}
                placeholder="Search conversations..."
                placeholderTextColor={COLORS.textSecondary}
                value={forwardSearch}
                onChangeText={setForwardSearch}
              />
              {forwardSearch.length > 0 && (
                <TouchableOpacity onPress={() => setForwardSearch('')}>
                  <X size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Chats list */}
            {isForwarding ? (
              <View style={styles.forwardLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.forwardLoadingText}>Forwarding message...</Text>
              </View>
            ) : (
              <FlatList
                data={(forwardChats.length > 0 ? forwardChats : [
                  { id: 'mock_1', name: 'Emma Watson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
                  { id: 'mock_2', name: 'Tech Birds Group 🦜', avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', isGroup: true },
                  { id: 'mock_3', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
                ]).filter((c) => {
                  const title = c.name || c.title || '';
                  return title.toLowerCase().includes(forwardSearch.toLowerCase());
                })}
                keyExtractor={(item) => item.id || item._id}
                style={styles.forwardList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.forwardChatItem}
                    onPress={() => handleConfirmForward(item)}
                    activeOpacity={0.7}
                  >
                    <Avatar
                      uri={item.avatar || item.avatarUrl || item.groupAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'}
                      size={44}
                    />
                    <View style={styles.forwardChatInfo}>
                      <Text style={styles.forwardChatName} numberOfLines={1}>
                        {item.name || item.title || 'Chat'}
                      </Text>
                      <Text style={styles.forwardChatSub} numberOfLines={1}>
                        {item.isGroup ? 'Group Conversation' : 'Direct Message'}
                      </Text>
                    </View>
                    <View style={styles.forwardSendBadge}>
                      <Forward size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.forwardEmptyState}>
                    <Text style={styles.forwardEmptyText}>No conversations found</Text>
                  </View>
                }
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
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
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  headerStatusOnline: {
    color: '#16A34A',
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD6C4',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 6,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary, // Cockatiel Cheek Coral #FF6B35
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cancelRecordingButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordingPulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 10,
  },
  recordingTimerText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginRight: 8,
  },
  recordingLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sendRecordingButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionBarContainer: {
    paddingHorizontal: 20,
  },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  reactionItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  reactionBarEmoji: {
    fontSize: 24,
  },
  emptyConversationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyConversationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyConversationSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  messageActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionMenuText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionMenuDangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  inChatSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inChatSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inChatSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 2,
  },
  searchCountBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  searchCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptySearchBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySearchSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
  },
  sheetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  sheetItem: {
    alignItems: 'center',
    width: 80,
  },
  sheetIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  sheetCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  replyPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyAccentLine: {
    width: 3.5,
    height: '100%',
    minHeight: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  replyPreviewText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  replyCancelBtn: {
    padding: 4,
    marginLeft: 8,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB', // Light amber background
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pinnedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pinnedTextCol: {
    flex: 1,
  },
  pinnedSender: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 1,
  },
  pinnedText: {
    fontSize: 13,
    color: COLORS.text,
  },
  unpinBtn: {
    padding: 6,
    marginLeft: 8,
  },
  // Forward Modal Styles
  forwardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  forwardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '80%',
    minHeight: 400,
  },
  forwardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  forwardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  forwardPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.primary,
  },
  forwardPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  forwardPreviewSnippet: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  forwardSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  forwardSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  forwardList: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  forwardChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  forwardChatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  forwardChatName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  forwardChatSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  forwardSendBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forwardLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forwardLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  forwardEmptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  forwardEmptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
