import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageSquare,
  Send,
  Mail,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
} from 'lucide-react-native';
import { COLORS } from '../src/constants/theme';
import { api } from '../src/services/api';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'How do Voice Notes with waveforms work?',
    answer:
      'Tap and hold or press the microphone button in any conversation to record your voice note. When finished, your audio is uploaded to Cloudinary and played back with an interactive, animated waveform.',
  },
  {
    id: '2',
    question: 'Where are my uploaded photos & voice notes stored?',
    answer:
      'All media is securely hosted on Cloudinary across dedicated folders (chats, avatars, groups, and voice) with ultra-fast CDN delivery.',
  },
  {
    id: '3',
    question: 'How does "Unsend for Everyone" work?',
    answer:
      'Long-press any message you sent and tap "Unsend for Everyone". The message is deleted from the server and instantly removed from every participant’s screen via Socket.IO.',
  },
  {
    id: '4',
    question: 'How do I add or remove members in a group?',
    answer:
      'Open any group chat, tap the header to open Group Details, and group admins will see the "Add Member" button and remove icons beside each participant.',
  },
  {
    id: '5',
    question: 'Are my audio and video calls private?',
    answer:
      'Yes! Calls are initiated through encrypted WebSocket signaling directly between you and your contact, with live call timers and call logs recorded in your account.',
  },
];

export default function SupportScreen() {
  const router = useRouter();

  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('1');
  const [category, setCategory] = useState<'Bug' | 'Feature' | 'Feedback'>('Bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const handleSubmitFeedback = async () => {
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your message or description.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.users.submitFeedback({
        category,
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      setSubmitted(true);
      setSubject('');
      setMessage('');
      Alert.alert('Thank You!', 'Your feedback has been received. Our team will review it promptly.');
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Text style={{ fontSize: 32 }}>🦜</Text>
          </View>
          <Text style={styles.heroTitle}>Cockatiel Support Hub</Text>
          <Text style={styles.heroSubtitle}>
            Have questions about features, noticed an issue, or want to suggest an improvement? We're here for the flock!
          </Text>
        </View>

        {/* FAQs Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <HelpCircle size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          </View>

          <View style={styles.card}>
            {FAQS.map((faq, index) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <View key={faq.id}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleFaq(faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQuestion, isExpanded && { color: COLORS.primary }]}>
                      {faq.question}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={20} color={COLORS.primary} />
                    ) : (
                      <ChevronDown size={20} color={COLORS.textSecondary} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqBody}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}

                  {index < FAQS.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Feedback / Bug Report Form */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MessageSquare size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>SEND US FEEDBACK OR REPORT A BUG</Text>
          </View>

          <View style={styles.card}>
            {/* Category Selector */}
            <Text style={styles.inputLabel}>CATEGORY</Text>
            <View style={styles.categoryRow}>
              {(['Bug', 'Feature', 'Feedback'] as const).map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                      {cat === 'Bug' ? '🐛 Bug' : cat === 'Feature' ? '✨ Feature' : '💬 Feedback'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subject Input */}
            <Text style={styles.inputLabel}>SUBJECT</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Issue with voice playback or audio calls"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={80}
            />

            {/* Description / Message */}
            <Text style={styles.inputLabel}>DESCRIPTION / DETAILS</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us what happened or what you'd love to see in Cockatiel..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitFeedback}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Submit to Flock Support</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Channels */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Mail size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>DIRECT CHANNELS</Text>
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL('mailto:support@cockatiel.app')}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconCircle}>
                <Mail size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSub}>support@cockatiel.app</Text>
              </View>
              <ExternalLink size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.contactRow}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <ShieldCheck size={20} color="#16A34A" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.contactTitle}>Security & Privacy Center</Text>
                <Text style={styles.contactSub}>Guaranteed end-to-end data integrity</Text>
              </View>
              <CheckCircle size={18} color="#16A34A" />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Feather Ivory #FAF9F6
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 10,
  },
  faqBody: {
    paddingBottom: 12,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.primary,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
});
