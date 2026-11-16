import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../src/constants/theme';

export default function AboutScreen() {
  const router = useRouter();

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
        <Text style={styles.title}>About</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.paragraph}>
          Excited to share my latest UI exploration for a Messaging App.
        </Text>

        <Text style={styles.paragraph}>
          The idea behind this concept is to make communication feel effortless and enjoyable with a clean interface, intuitive conversations, and thoughtful interactions that help people stay connected through fast, seamless, and meaningful messaging.
        </Text>

        <Text style={styles.heading}>What you can do:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Get Inspired:</Text> Use for your own projects.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Save Time:</Text> Use as a starting point.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Customize:</Text> Modify for your needs.</Text>
        </View>

        <Text style={styles.heading}>What you can't do:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Commercial Use:</Text> For personal and educational use only.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Resell:</Text> Do not resell or redistribute.</Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.text,
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  bulletList: {
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '700',
  },
});
