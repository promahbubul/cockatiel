import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, MessageSquare } from 'lucide-react-native';

export default function AudioCallScreen() {
  const router = useRouter();
  const { name, avatar } = useLocalSearchParams();
  const callerName = (name as string) || 'Emma Watson';
  const callerAvatar = (avatar as string) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80';

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

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
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topSection}>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.durationText}>{formatTime(seconds)}</Text>
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
            onPress={() => setIsMuted(!isMuted)}
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
            onPress={() => router.back()}
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
    backgroundColor: '#0F172A',
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
    color: '#94A3B8',
    fontWeight: '600',
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
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
});
