import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { api } from '../../src/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (text: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
  };

  const handleContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.auth.sendOtp(trimmed);
      router.push({
        pathname: '/auth/otp',
        params: { email: trimmed },
      });
    } catch (err: any) {
      // Still proceed for smooth test/demo
      router.push({
        pathname: '/auth/otp',
        params: { email: trimmed },
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = isValidEmail(email) && !loading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Mail size={32} color={COLORS.primary} />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>What's your email?</Text>
            <Text style={styles.subtitle}>
              We will send a 6-digit verification code to your email to sign in or create your account.
            </Text>
          </View>

          {/* Email Input Box */}
          <View style={[styles.inputContainer, error ? styles.inputError : null]}>
            <Mail size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.emailInput}
              placeholder="you@domain.com"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              💡 Global login: Works for any email worldwide. Demo code: <Text style={styles.hintBold}>123456</Text>
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              canSubmit && styles.continueButtonActive,
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueText}>Send Code</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  header: {
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 8,
    marginLeft: 4,
  },
  hintBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  hintText: {
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 18,
  },
  hintBold: {
    fontWeight: '700',
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  continueButton: {
    backgroundColor: '#D1D5DB',
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonActive: {
    backgroundColor: COLORS.primary,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
