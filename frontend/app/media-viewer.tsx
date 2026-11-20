import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Share2, Download, Check } from 'lucide-react-native';
import { COLORS } from '../src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MediaViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const imageUrl =
    (params.uri as string) ||
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80';
  const senderName = (params.senderName as string) || 'Photo';
  const timestamp = (params.timestamp as string) || '';
  const caption = (params.caption as string) || '';

  const [isSaved, setIsSaved] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        url: imageUrl,
        message: caption ? `${caption}\n${imageUrl}` : `Check out this photo from Cockatiel!\n${imageUrl}`,
      });
    } catch (e: any) {
      console.error('Share error:', e);
    }
  };

  const handleDownload = async () => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `cockatiel_${Date.now()}.jpg`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        await Linking.openURL(imageUrl);
        setIsSaved(true);
        Alert.alert('Download Initiated', 'The image URL was opened for saving.');
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err: any) {
      console.error('Download error:', err);
      Alert.alert('Download Error', 'Could not initiate download.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Header Bar */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {senderName}
            </Text>
            {timestamp ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {timestamp}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.circleBtn, isSaved && styles.circleBtnActive]}
            onPress={handleDownload}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            {isSaved ? <Check size={20} color="#10B981" /> : <Download size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtn, { marginLeft: 10 }]}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Share2 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Pinch-to-Zoom Image Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        maximumZoomScale={4}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        centerContent
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </ScrollView>

      {/* Bottom Caption Overlay */}
      {caption ? (
        <SafeAreaView style={styles.captionContainer} edges={['bottom']}>
          <View style={styles.captionGlass}>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  captionGlass: {
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  captionText: {
    fontSize: 14,
    color: '#FAF9F6',
    lineHeight: 20,
    fontWeight: '500',
  },
});
