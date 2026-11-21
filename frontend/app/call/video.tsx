import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mic, MicOff, Video, VideoOff, SwitchCamera, PhoneOff } from 'lucide-react-native';
import { CURRENT_USER } from '../../src/constants/mockData';
import { socketService } from '../../src/services/socket';
import { api } from '../../src/services/api';
import { agoraService } from '../../src/services/agoraService';

export default function VideoCallScreen() {
  const router = useRouter();
  const { name, avatar, toUserId, roomName, isCaller, chatId: paramChatId } = useLocalSearchParams();
  const callerName = (name as string) || 'User';
  const remoteVideoUrl = (avatar as string) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80';
  const targetUserId = (toUserId as string) || '';
  const currentRoomName = (roomName as string) || `call_${Date.now()}`;
  const isCallerUser = isCaller === 'true';
  const chatId = (paramChatId as string) || '';

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
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

  // Initialize Agora Video Call
  useEffect(() => {
    // Delay slightly to ensure DOM elements with nativeIDs are mounted
    const initTimer = setTimeout(() => {
      agoraService.initVideoCall(
        currentRoomName,
        'agora-local-video',
        'agora-remote-video',
        () => setHasRemoteVideo(true)
      );
    }, 150);

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
      clearTimeout(initTimer);
      clearInterval(timer);
      unsubEnd?.();
      agoraService.leave();
    };
  }, [currentRoomName]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    agoraService.setMuted(nextMuted);
  };

  const toggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    agoraService.setVideoDisabled(nextVideoOff);
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
          callType: 'video',
          direction: isCallerUser ? 'outgoing' : 'incoming',
          duration,
          roomName: currentRoomName,
        })
        .catch(() => {});
    }

    if (chatId) {
      const callLogText = `📹 Video call • ${duration}`;
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
    <View style={styles.container}>
      {/* Remote Video Stream Container */}
      <View
        nativeID="agora-remote-video"
        id="agora-remote-video"
        style={styles.remoteVideo}
      >
        {!hasRemoteVideo && (
          <Image source={{ uri: remoteVideoUrl }} style={styles.fallbackRemoteImage} />
        )}
      </View>

      {/* Floating Header */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.callerInfoBadge}>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.durationText}>{formatTime(seconds)}</Text>
        </View>

        {/* Floating Self Video Picture-in-Picture */}
        <View
          nativeID="agora-local-video"
          id="agora-local-video"
          style={styles.selfVideoContainer}
        >
          {isVideoOff ? (
            <View style={styles.videoOffOverlay}>
              <VideoOff size={22} color="#FFFFFF" />
            </View>
          ) : (
            Platform.OS !== 'web' && (
              <Image source={{ uri: CURRENT_USER.avatar }} style={styles.selfVideo} />
            )
          )}
        </View>
      </SafeAreaView>

      {/* Floating Bottom Action Toolbar */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[styles.toolBtn, isMuted && styles.toolBtnActive]}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            {isMuted ? <MicOff size={22} color="#EF4444" /> : <Mic size={22} color="#FFFFFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, isVideoOff && styles.toolBtnActive]}
            onPress={toggleVideo}
            activeOpacity={0.8}
          >
            {isVideoOff ? <VideoOff size={22} color="#EF4444" /> : <Video size={22} color="#FFFFFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.endCallBtn}
            onPress={handleEndCall}
            activeOpacity={0.8}
          >
            <PhoneOff size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#181615',
    overflow: 'hidden',
  },
  fallbackRemoteImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topOverlay: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  callerInfoBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  durationText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  selfVideoContainer: {
    width: 100,
    height: 145,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FBBF24',
    backgroundColor: '#262321',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  selfVideo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoOffOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 22, 21, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 22, 21, 0.85)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 36,
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#383431',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  endCallBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
