import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, MessageSquare } from 'lucide-react-native';
import { socketService } from '../../src/services/socket';
import { api } from '../../src/services/api';
import { agoraService } from '../../src/services/agoraService';

export default function AudioCallScreen() {
  const router = useRouter();
  const { name, avatar, toUserId, roomName, isCaller, chatId: paramChatId } = useLocalSearchParams();
  const callerName = (name as string) || 'User';
  const callerAvatar = (avatar as string) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80';
  const targetUserId = (toUserId as string) || '';
  const currentRoomName = (roomName as string) || `call_${Date.now()}`;
  const isCallerUser = isCaller === 'true';
  const chatId = (paramChatId as string) || '';

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callWarning, setCallWarning] = useState<string | null>(null);
  const secondsRef = useRef(0);
  const hasEndedRef = useRef(false);

  const safeExit = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Join Agora Audio Channel on mount
  useEffect(() => {
    agoraService.initAudioCall(currentRoomName, undefined, (err) => setCallWarning(err));

    const timer = setInterval(() => {
      setSeconds((prev) => {
        secondsRef.current = prev + 1;
        return prev + 1;
      });
    }, 1000);

    const unsubEnd = socketService.onCallEnded(async () => {
      if (!hasEndedRef.current) {
        hasEndedRef.current = true;
        await agoraService.leave();
        safeExit();
      }
    });

    return () => {
      clearInterval(timer);
      unsubEnd?.();
      agoraService.leave();
    };
  }, [currentRoomName]);

  // Sync mute state with Agora
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    agoraService.setMuted(nextMuted);
  };

  const handleEndCall = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    const duration = formatTime(secondsRef.current);

    await agoraService.leave();

    if (targetUserId) {
      socketService.endCall({ toUserId: targetUserId, roomName: currentRoomName });

      api.calls
        .logCall({
          receiverId: targetUserId,
          callType: 'audio',
          direction: isCallerUser ? 'outgoing' : 'incoming',
          duration,
          roomName: currentRoomName,
        })
        .catch(() => {});
    }

    if (chatId) {
      const callLogText = `📞 Audio call • ${duration}`;
      try {
        const msgRes = await api.messages.send({
          chatId,
          content: callLogText,
        });
        if (msgRes.success && msgRes.message) {
          socketService.emitMessage(chatId, msgRes.message);
        }
      } catch (e) {
        console.warn('Failed to log call end message:', e);
      }
    }

    safeExit();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topSection}>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.durationText}>{formatTime(seconds)}</Text>
        {Boolean(callWarning) && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ {callWarning}</Text>
          </View>
        )}
      </View>

      {/* Center Avatar */}
      <View style={styles.centerSection}>
        <Image source={{ uri: callerAvatar }} style={styles.avatar} />
      </View>

      {/* Controls */}
      <View style={styles.bottomSection}>
        <View style={styles.controlsGrid}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            {isMuted ? <MicOff size={24} color="#EF4444" /> : <Mic size={24} color="#FFFFFF" />}
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
            onPress={() => setIsSpeaker(!isSpeaker)}
            activeOpacity={0.8}
          >
            {isSpeaker ? <Volume2 size={24} color="#22C55E" /> : <VolumeX size={24} color="#FFFFFF" />}
            <Text style={styles.controlLabel}>{isSpeaker ? 'Speaker On' : 'Speaker'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => safeExit()}
            activeOpacity={0.8}
          >
            <MessageSquare size={24} color="#FFFFFF" />
            <Text style={styles.controlLabel}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* End Call Button */}
        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall} activeOpacity={0.8}>
          <PhoneOff size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181615',
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  callerName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  durationText: {
    fontSize: 16,
    color: '#FBBF24',
    fontWeight: '700',
    letterSpacing: 1,
  },
  centerSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  controlsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 36,
  },
  controlBtn: {
    alignItems: 'center',
    width: 64,
  },
  controlBtnActive: {
    opacity: 0.9,
  },
  controlLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  warningBox: {
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
