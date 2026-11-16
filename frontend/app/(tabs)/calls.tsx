import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneCall } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { MOCK_CALLS } from '../../src/constants/mockData';
import { CallListItem } from '../../src/components/CallListItem';

export default function CallsScreen() {
  const [filter, setFilter] = useState<'all' | 'missed'>('all');

  const filteredCalls = MOCK_CALLS.filter((call) => {
    if (filter === 'missed') {
      return call.direction === 'missed';
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
          <PhoneCall size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Segmented Control: All / Missed */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedTrack}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              filter === 'all' && styles.activeSegmentTab,
            ]}
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                filter === 'all' && styles.activeSegmentText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              filter === 'missed' && styles.activeSegmentTab,
            ]}
            onPress={() => setFilter('missed')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                filter === 'missed' && styles.activeSegmentText,
              ]}
            >
              Missed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calls List */}
      <FlatList
        data={filteredCalls}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CallListItem
            call={item}
            onPress={() => {}}
            onInfoPress={() => {}}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 22,
    padding: 3,
    height: 44,
  },
  segmentTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
  },
  activeSegmentTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeSegmentText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
});
