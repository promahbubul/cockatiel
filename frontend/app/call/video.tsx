import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mic, MicOff, Video, VideoOff, SwitchCamera, PhoneOff } from 'lucide-react-native';
import { CURRENT_USER } from '../../src/constants/mockData';

export default function VideoCallScreen() {
  const router = useRouter();
  const { name, avatar } = useLocalSearchParams();
  const callerName = (name as string) || 'Emma Watson';
  const remoteVideoUrl = (avatar as string) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80';

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleEndCall = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Remote Video Stream Fullscreen */}
      <Image source={{ uri: remoteVideoUrl }} style={styles.remoteVideo} />

      {/* Floating Header */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.callerInfoBadge}>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.durationText}>{formatTime(seconds)}</Text>
        </View>

        {/* Floating Self Video Picture-in-Picture */}
        <View style={styles.selfVideoContainer}>
          <Image source={{ uri: CURRENT_USER.avatar }} style={styles.selfVideo} />
          {isVideoOff && (
            <View style={styles.videoOffOverlay}>
              <VideoOff size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Floating Bottom Action Toolbar */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[styles.toolBtn, isMuted && styles.toolBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
            activeOpacity={0.8}
          >
            {isMuted ? <MicOff size={22} color="#EF4444" /> : <Mic size={22} color="#FFFFFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, isVideoOff && styles.toolBtnActive]}
            onPress={() => setIsVideoOff(!isVideoOff)}
            activeOpacity={0.8}
          >
            {isVideoOff ? <VideoOff size={22} color="#EF4444" /> : <Video size={22} color="#FFFFFF" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} activeOpacity={0.8}>
            <SwitchCamera size={22} color="#FFFFFF" />
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
  },
  callerInfoBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    width: 90,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FBBF24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 36,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  toolBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  endCallBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
