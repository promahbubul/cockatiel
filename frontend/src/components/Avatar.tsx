import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/theme';

interface AvatarProps {
  uri: string;
  size?: number;
  isOnline?: boolean;
  showStoryRing?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 50,
  isOnline = false,
  showStoryRing = false,
}) => {
  const badgeSize = Math.max(12, Math.round(size * 0.28));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.imageWrapper,
          { width: size, height: size, borderRadius: size / 2 },
          showStoryRing && styles.storyRing,
        ]}
      >
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </View>
      {isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  imageWrapper: {
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  storyRing: {
    borderWidth: 2.5,
    borderColor: COLORS.accentGold,
  },
  image: {
    resizeMode: 'cover',
  },
  onlineBadge: {
    position: 'absolute',
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: COLORS.online,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
});
