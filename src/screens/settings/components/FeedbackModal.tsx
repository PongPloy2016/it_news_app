import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { styles } from '../styles';
import { SettingsViewModel } from '../types';

interface FeedbackModalProps {
  vm: SettingsViewModel;
}

export function FeedbackModal({ vm }: FeedbackModalProps) {
  const {
    isFeedbackModalVisible,
    setIsFeedbackModalVisible,
    feedbackCategory,
    setFeedbackCategory,
    feedbackMessage,
    setFeedbackMessage,
    feedbackContact,
    setFeedbackContact,
    isSubmitting,
    handleSubmitFeedback,
    colors,
    isDark,
    t,
  } = vm;

  return (
    <Modal
      visible={isFeedbackModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsFeedbackModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.modalDragHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.feedback_modal_title}</Text>
            <Pressable hitSlop={8} onPress={() => setIsFeedbackModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          {/* Category selection chips */}
          <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.feedback_modal_sub}</Text>
          <View style={styles.categoryRow}>
            {(
              [
                ['general', t.feedback_cat_general],
                ['bug', t.feedback_cat_bug],
                ['suggest_feed', t.feedback_cat_suggest],
              ] as const
            ).map(([catKey, catLabel]) => (
              <Pressable
                key={catKey}
                onPress={() => setFeedbackCategory(catKey)}
                style={[
                  styles.categoryChip,
                  feedbackCategory === catKey && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  feedbackCategory !== catKey && { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: feedbackCategory === catKey ? colors.onPrimary : colors.text },
                  ]}
                >
                  {catLabel}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Message input */}
          <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.feedback_placeholder}</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                color: colors.text,
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
            multiline
            numberOfLines={4}
            placeholder={t.feedback_placeholder}
            placeholderTextColor={colors.muted}
            value={feedbackMessage}
            onChangeText={setFeedbackMessage}
          />

          {/* Contact input */}
          <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.feedback_contact_label}</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
            placeholder={t.feedback_contact_placeholder}
            placeholderTextColor={colors.muted}
            value={feedbackContact}
            onChangeText={setFeedbackContact}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Submit button */}
          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleSubmitFeedback()}
            style={[
              styles.submitModalBtn,
              { backgroundColor: colors.primary },
              isSubmitting && { opacity: 0.6 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.submitModalBtnText, { color: colors.onPrimary }]}>
                {t.btn_submit}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
