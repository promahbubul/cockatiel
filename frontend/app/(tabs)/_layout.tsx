import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { MessageCircle, Users, Phone, User as UserIcon } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeBar} />}
              <MessageCircle size={24} color={color} fill={focused ? color : 'none'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeBar} />}
              <Users size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeBar} />}
              <Phone size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeBar} />}
              <UserIcon size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    position: 'relative',
    height: 32,
    justifyContent: 'center',
  },
  activeBar: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
