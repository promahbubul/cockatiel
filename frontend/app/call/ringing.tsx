import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, PhoneOff, Video } from 'lucide-react-native';

export default function RingingScreen() {
  const router = useRouter();
  const { name, avatar, type, isIncoming } = useLocalSearchParams();

  const callerName = (name as string) || 'Emma Watson';
  const callerAvatar = (avatar as string) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80';
  const isVideo = type === 'video';
  const incoming = isIncoming === 'true';

  const handleAccept = () => {
    if (isVideo) {
      router.replace({ pathname: '/call/video', params: { name: callerName, avatar: callerAvatar } });
    } else {
      router.replace({ pathname: '/call/audio', params: { name: callerName, avatar: callerAvatar } });
    }
  };

  const handleDecline = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topSection}>
        <Text style={styles.statusText}>
          {incoming ? (isVideo ? 'Incoming Video Call...' : 'Incoming Audio Call...') : 'Ringing...'}
        </Text>
        <Text style={styles.nameText}>{callerName}</Text>
      </View>

      {/* Pulsing Avatar Area */}
      <View style={styles.centerSection}>
        <View style={styles.outerRing}>
          <View style={styles.middleRing}>
            <Image source={{ uri: callerAvatar }} style={styles.avatar} />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomSection}>
        {incoming ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDecline}>
              <PhoneOff size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept}>
              {isVideo ? <Video size={28} color="#FFFFFF" /> : <Phone size={28} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.singleActionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDecline}>
              <PhoneOff size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181615',
    justifyContent: 'space-between',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusText: {
    fontSize: 15,
    color: '#D6D3D1',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#FBBF24',
  },
  bottomSection: {
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 36,
  },
  singleActionRow: {
    alignItems: 'center',
  },
  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  declineBtn: {
    backgroundColor: '#EF4444',
  },
  acceptBtn: {
    backgroundColor: '#22C55E',
  },
});
