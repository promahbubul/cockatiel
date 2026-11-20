import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../constants/theme';

interface VoiceNotePlayerProps {
  audioUrl: string;
  isOutgoing: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ audioUrl, isOutgoing }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handlePlayPause = async () => {
    try {
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      setIsLoading(true);
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true },
        (status) => {
          if (status.isLoaded) {
            setPositionMs(status.positionMillis);
            setDurationMs(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish && !status.isLooping) {
              setIsPlaying(false);
              setPositionMs(0);
              sound.setPositionAsync(0).catch(() => {});
            }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing voice note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlaybackRate = async () => {
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(nextRate, true);
      } catch (err) {
        console.error('Error changing playback rate:', err);
      }
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const waveformHeights = [14, 22, 10, 26, 18, 30, 16, 24, 12, 20, 28, 14, 18, 10];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.playButton,
          isOutgoing ? styles.playButtonOutgoing : styles.playButtonIncoming,
        ]}
        onPress={handlePlayPause}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isOutgoing ? COLORS.primary : '#FFFFFF'} />
        ) : isPlaying ? (
          <Pause size={18} color={isOutgoing ? COLORS.primary : '#FFFFFF'} />
        ) : (
          <Play size={18} color={isOutgoing ? COLORS.primary : '#FFFFFF'} style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>

      {/* Waveform Graphic */}
      <View style={styles.waveformWrapper}>
        <View style={styles.waveformContainer}>
          {waveformHeights.map((h, i) => {
            const barFraction = (i + 1) / waveformHeights.length;
            const isPlayed = progress >= barFraction;
            return (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  { height: h },
                  isOutgoing
                    ? isPlayed
                      ? styles.barOutgoingPlayed
                      : styles.barOutgoingUnplayed
                    : isPlayed
                    ? styles.barIncomingPlayed
                    : styles.barIncomingUnplayed,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.durationText,
              isOutgoing ? styles.durationOutgoing : styles.durationIncoming,
            ]}
          >
            {isPlaying || positionMs > 0 ? formatTime(positionMs) : durationMs > 0 ? formatTime(durationMs) : '0:00'}
          </Text>

          {/* Speed Toggle Pill */}
          <TouchableOpacity
            style={[
              styles.speedBadge,
              isOutgoing ? styles.speedBadgeOutgoing : styles.speedBadgeIncoming,
              playbackRate !== 1 && (isOutgoing ? styles.speedBadgeOutgoingActive : styles.speedBadgeIncomingActive),
            ]}
            onPress={togglePlaybackRate}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text
              style={[
                styles.speedText,
                isOutgoing ? styles.speedTextOutgoing : styles.speedTextIncoming,
              ]}
            >
              {playbackRate}x
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    minWidth: 200,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playButtonOutgoing: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  playButtonIncoming: {
    backgroundColor: COLORS.primary, // Cockatiel Cheek Coral
  },
  waveformWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 3,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  barOutgoingPlayed: {
    backgroundColor: '#FFFFFF',
  },
  barOutgoingUnplayed: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  barIncomingPlayed: {
    backgroundColor: COLORS.primary,
  },
  barIncomingUnplayed: {
    backgroundColor: COLORS.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
  },
  durationOutgoing: {
    color: '#FEF3C7', // Canary Gold Light
  },
  durationIncoming: {
    color: COLORS.textSecondary,
  },
  speedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  speedBadgeOutgoing: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  speedBadgeIncoming: {
    backgroundColor: '#F3F4F6',
    borderColor: COLORS.border,
  },
  speedBadgeOutgoingActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  speedBadgeIncomingActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  speedText: {
    fontSize: 10,
    fontWeight: '800',
  },
  speedTextOutgoing: {
    color: '#FFFFFF',
  },
  speedTextIncoming: {
    color: COLORS.text,
  },
});
