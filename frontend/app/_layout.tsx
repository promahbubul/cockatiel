import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { socketService } from '../src/services/socket';

function GlobalCallManager({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    console.log('[GlobalCallManager] Mounting and registering onIncomingCall listener');
    const unsub = socketService.onIncomingCall((payload) => {
      console.log('[GlobalCallManager] INCOMING CALL RECEIVED:', payload);
      router.push({
        pathname: '/call/ringing',
        params: {
          name: payload?.caller?.displayName || 'User',
          avatar: payload?.caller?.avatarUrl || '',
          type: payload?.callType || 'audio',
          isIncoming: 'true',
          fromUserId: payload?.caller?.id || '',
          roomName: payload?.roomName || `room_${Date.now()}`,
        },
      });
    });

    return () => {
      unsub?.();
    };
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GlobalCallManager>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="conversation/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="new-message"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="support"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Auth Flow */}
        <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/verify-email" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/otp" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/reset-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/setup-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />

        {/* Calling Interfaces */}
        <Stack.Screen name="call/ringing" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="call/audio" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="call/video" options={{ presentation: 'fullScreenModal', headerShown: false }} />

        {/* Group & Details */}
        <Stack.Screen name="group/create" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="chat-info/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />

        {/* Media & Settings */}
        <Stack.Screen name="media-viewer" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="settings/notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/privacy" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
      </GlobalCallManager>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
