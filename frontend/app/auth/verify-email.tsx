import React, { useState, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ArrowRight, RotateCw, MailCheck } from 'lucide-react-native';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const userEmail = String(email || 'alex@cockatiel.app').trim();
  const { verifyEmail } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef<any[]>([]);

  const handleTextChange = (text: string, index: number) => {
    if (errorMessage) setErrorMessage('');
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isComplete = code.every((digit) => digit.length > 0);

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    setErrorMessage('');
    const pin = code.join('');

    const result = await verifyEmail(userEmail, pin);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setErrorMessage(result.error || 'Invalid verification code. Use demo code: 123456');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    setErrorMessage('');
    try {
      await api.auth.sendOtp(userEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch {
      setResendSuccess(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
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
            <MailCheck size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit confirmation code to{' '}
            <Text style={styles.boldText}>{userEmail}</Text>
          </Text>

          {/* 6-box Pin Input */}
          <View style={styles.otpRow}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  errorMessage ? styles.otpBoxError : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleTextChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {/* Resend Action */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendPrompt}>Didn't receive code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7} style={styles.resendButton}>
              {resending ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <RotateCw size={14} color={COLORS.primary} style={styles.rotateIcon} />
                  <Text style={styles.resendText}>
                    {resendSuccess ? 'Code Resent!' : 'Resend Code'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              💡 Demo code: <Text style={styles.hintBold}>123456</Text> (instantly verifies your email)
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              isComplete && !loading && styles.verifyButtonActive,
            ]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={!isComplete || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.verifyText}>Verify & Complete</Text>
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
  container: {
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
    paddingTop: 20,
    alignItems: 'center',
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  resendPrompt: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rotateIcon: {
    marginRight: 4,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  hintBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    width: '100%',
  },
  hintText: {
    fontSize: 13,
    color: '#0369A1',
    textAlign: 'center',
  },
  hintBold: {
    fontWeight: '700',
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  verifyButton: {
    backgroundColor: '#D1D5DB',
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  verifyButtonActive: {
    backgroundColor: COLORS.primary,
  },
  verifyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
