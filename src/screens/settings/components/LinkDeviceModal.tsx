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

interface LinkDeviceModalProps {
  vm: SettingsViewModel;
}

export function LinkDeviceModal({ vm }: LinkDeviceModalProps) {
  const {
    isImportModalVisible,
    setIsImportModalVisible,
    targetDeviceId,
    setTargetDeviceId,
    isImporting,
    handleImportBookmarks,
    colors,
    isDark,
    t,
  } = vm;

  return (
    <Modal
      visible={isImportModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsImportModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.modalDragHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="cloud-download-outline" size={22} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.modal_link_title}</Text>
            </View>
            <Pressable hitSlop={8} onPress={() => setIsImportModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={[styles.fieldSubLabel, { color: colors.muted, marginBottom: 12, lineHeight: 18 }]}>
            {t.modal_link_sub}
          </Text>

          <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.modal_link_label}</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                color: colors.text,
                borderColor: colors.border,
                height: 48,
              },
            ]}
            placeholder="e.g. d1e2f3a4-..."
            placeholderTextColor={colors.muted}
            value={targetDeviceId}
            onChangeText={setTargetDeviceId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            disabled={isImporting}
            onPress={() => void handleImportBookmarks()}
            style={[
              styles.submitModalBtn,
              { backgroundColor: colors.primary, marginTop: 12 },
              isImporting && { opacity: 0.6 },
            ]}
          >
            {isImporting ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.submitModalBtnText, { color: colors.onPrimary }]}>
                {t.btn_import}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
