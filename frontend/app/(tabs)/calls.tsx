import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PhoneCall } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { MOCK_CALLS } from '../../src/constants/mockData';
import { CallListItem } from '../../src/components/CallListItem';
import { api } from '../../src/services/api';
import { CallLogItem } from '../../src/types';

export default function CallsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [calls, setCalls] = useState<CallLogItem[]>(MOCK_CALLS);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCalls = async () => {
    try {
      const res = await api.calls.getCalls();
      if (res.success && res.calls && res.calls.length > 0) {
        const mapped: CallLogItem[] = res.calls.map((c: any) => ({
          id: c.id,
          name: c.otherUser?.displayName || 'User',
          avatar: c.otherUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          callType: c.callType,
          direction: c.direction,
          timestamp: c.createdAt
            ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recent',
          duration: c.duration,
        }));
        setCalls(mapped);
      }
    } catch {
      // Keep mock calls if backend is starting
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCalls();
    setRefreshing(false);
  };

  const filteredCalls = calls.filter((call) => {
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/new-message')}
          activeOpacity={0.8}
        >
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
            onPress={() =>
              router.push({
                pathname: item.callType === 'video' ? '/call/video' : '/call/audio',
                params: { name: item.name, avatar: item.avatar },
              })
            }
            onInfoPress={() =>
              router.push({
                pathname: '/call/ringing',
                params: { name: item.name, avatar: item.avatar, type: item.callType },
              })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent calls</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeSegmentTab: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeSegmentText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
