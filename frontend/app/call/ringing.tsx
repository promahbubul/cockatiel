import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, PhoneOff, Video } from 'lucide-react-native';
import { socketService } from '../../src/services/socket';
import { api } from '../../src/services/api';

export default function RingingScreen() {
  const router = useRouter();
  const {
    name,
    avatar,
    type,
    isIncoming,
    toUserId,
    fromUserId,
    roomName: paramRoomName,
  } = useLocalSearchParams();

  const callerName = (name as string) || 'User';
  const callerAvatar =
    (avatar as string) ||
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80';
  const isVideo = type === 'video';
  const incoming = isIncoming === 'true';
  const targetUserId = (incoming ? fromUserId : toUserId) as string;
  const roomName = (paramRoomName as string) || `room_${Date.now()}`;

  const [callStatus, setCallStatus] = useState<string>(
    incoming
      ? isVideo
        ? 'Incoming Video Call...'
        : 'Incoming Audio Call...'
      : 'Ringing...'
  );

  useEffect(() => {
    // Auto-timeout if no answer after 22 seconds
    let noAnswerTimer: any;
    if (!incoming) {
      noAnswerTimer = setTimeout(() => {
        setCallStatus('No Answer');
        setTimeout(() => {
          router.back();
        }, 1500);
      }, 22000);
    }

    // Listen if other party accepts
    const unsubAccept = socketService.onCallAccepted(() => {
      clearTimeout(noAnswerTimer);
      setCallStatus('Connected! Starting call...');
      setTimeout(() => {
        if (isVideo) {
          router.replace({
            pathname: '/call/video',
            params: {
              name: callerName,
              avatar: callerAvatar,
              toUserId: targetUserId,
              roomName,
              isCaller: 'true',
            },
          });
        } else {
          router.replace({
            pathname: '/call/audio',
            params: {
              name: callerName,
              avatar: callerAvatar,
              toUserId: targetUserId,
              roomName,
              isCaller: 'true',
            },
          });
        }
      }, 500);
    });

    // Listen if call rejected
    const unsubReject = socketService.onCallRejected((payload) => {
      clearTimeout(noAnswerTimer);
      setCallStatus(`Call ${payload?.reason || 'declined'}`);
      setTimeout(() => {
        router.back();
      }, 1200);
    });

    // Listen if caller cancelled / ended before answer
    const unsubEnd = socketService.onCallEnded(() => {
      clearTimeout(noAnswerTimer);
      setCallStatus('Call ended');
      setTimeout(() => {
        router.back();
      }, 800);
    });

    return () => {
      clearTimeout(noAnswerTimer);
      unsubAccept?.();
      unsubReject?.();
      unsubEnd?.();
    };
  }, [callerName, callerAvatar, isVideo, targetUserId, roomName, incoming]);

  const handleAccept = () => {
    if (targetUserId) {
      socketService.acceptCall({ toUserId: targetUserId, roomName });
    }

    if (isVideo) {
      router.replace({
        pathname: '/call/video',
        params: {
          name: callerName,
          avatar: callerAvatar,
          toUserId: targetUserId,
          roomName,
          isCaller: 'false',
        },
      });
    } else {
      router.replace({
        pathname: '/call/audio',
        params: {
          name: callerName,
          avatar: callerAvatar,
          toUserId: targetUserId,
          roomName,
          isCaller: 'false',
        },
      });
    }
  };

  const handleDecline = () => {
    if (incoming) {
      if (targetUserId) {
        socketService.rejectCall({ toUserId: targetUserId, roomName, reason: 'declined' });
        // Log missed call
        api.calls
          .logCall({
            receiverId: targetUserId,
            callType: isVideo ? 'video' : 'audio',
            direction: 'missed',
            roomName,
          })
          .catch(() => {});
      }
    } else {
      if (targetUserId) {
        socketService.endCall({ toUserId: targetUserId, roomName });
      }
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topSection}>
        <Text style={styles.statusText}>{callStatus}</Text>
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
        {!incoming && (
          <View style={styles.simulateBox}>
            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={() => {
                setCallStatus('Connected! Starting call...');
                setTimeout(() => {
                  if (isVideo) {
                    router.replace({
                      pathname: '/call/video',
                      params: {
                        name: callerName,
                        avatar: callerAvatar,
                        toUserId: targetUserId,
                        roomName,
                        isCaller: 'true',
                      },
                    });
                  } else {
                    router.replace({
                      pathname: '/call/audio',
                      params: {
                        name: callerName,
                        avatar: callerAvatar,
                        toUserId: targetUserId,
                        roomName,
                        isCaller: 'true',
                      },
                    });
                  }
                }, 300);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.simulateBtnText}>Simulate Answer (Quick Test) 📞</Text>
            </TouchableOpacity>
            <Text style={styles.simulateHint}>
              Tip: For live calling, open an incognito window and log into {callerName}
            </Text>
          </View>
        )}

        {incoming ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <PhoneOff size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              {isVideo ? <Video size={28} color="#FFFFFF" /> : <Phone size={28} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.singleActionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
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
  simulateBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  simulateBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FBBF24',
    marginBottom: 8,
  },
  simulateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  simulateHint: {
    fontSize: 11,
    color: '#A8A29E',
    textAlign: 'center',
    maxWidth: 260,
  },
});
