import { useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Share,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyticsService } from '../../services/analyticsService';
import { submitAppFeedback } from '../../services/appSettingsService';
import { getDeviceId } from '../../services/deviceIdService';
import { useNews } from '../../store/NewsContext';
import { SettingsViewModel } from './types';

export function useSettingsViewModel(): SettingsViewModel {
  const insets = useSafeAreaInsets();
  const {
    articles,
    bookmarks,
    searchHistory,
    readArticles,
    settings,
    remoteSettings,
    colors,
    scale,
    isDark,
    setThemeMode,
    setFontSize,
    setCardLayout,
    setAiReaderEnabled,
    setLinkOpenMode,
    setDataSaverEnabled,
    clearNewsCache,
    clearBookmarks,
    clearReadArticles,
    clearSearchHistory,
    syncCloudBookmarks,
    isSyncingBookmarks,
    importBookmarksFromDevice,
    isCloudSyncActive,
    setCloudSyncEnabled,
    language,
    resolvedLanguage,
    setLanguage,
    t,
  } = useNews();

  const [deviceId, setDeviceId] = useState<string>('');
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  useEffect(() => {
    void analyticsService.logScreenView(t.settings_title, 'SettingsScreen', {
      page_title: t.settings_title,
    });
  }, [t.settings_title]);

  // Import Device Modal State
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Feedback Modal State
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggest_feed' | 'general'>('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme Dropdown State
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  const toggleThemeDropdown = () => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsThemeDropdownOpen((prev) => !prev);
  };

  const closeThemeDropdown = () => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsThemeDropdownOpen(false);
  };

  useEffect(() => {
    void getDeviceId().then(setDeviceId);
  }, []);

  const readCount = Object.keys(readArticles).length;
  const historyCount = searchHistory.length;
  const bookmarkCount = Object.keys(bookmarks).length;
  const cacheCount = articles.length;

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const result = await syncCloudBookmarks();
      if (result.success) {
        Alert.alert(
          t.alert_sync_success_title,
          t.alert_sync_success_msg.replace('{count}', String(result.count)),
        );
      } else {
        Alert.alert(
          t.alert_sync_fail_title,
          t.alert_sync_fail_msg,
        );
      }
    } catch {
      Alert.alert(t.alert_error, t.alert_sync_fail_msg);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleShareDeviceId = async () => {
    if (!deviceId) return;
    try {
      await Share.share({
        title: 'TechThaiNews Device ID',
        message: `TechThaiNews Device ID: ${deviceId}`,
      });
    } catch {
      Alert.alert(t.device_id_label, deviceId);
    }
  };

  const handleImportBookmarks = async () => {
    if (!targetDeviceId.trim()) {
      Alert.alert(t.alert_notice, t.alert_enter_device_id);
      return;
    }
    setIsImporting(true);
    const result = await importBookmarksFromDevice(targetDeviceId.trim());
    setIsImporting(false);
    if (result.success) {
      setIsImportModalVisible(false);
      setTargetDeviceId('');
      Alert.alert(t.import_success_title, t.import_success_msg.replace('{count}', String(result.count)));
    } else {
      Alert.alert(t.alert_error, result.error || t.alert_error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert(t.alert_notice, t.feedback_alert_empty);
      return;
    }

    setIsSubmitting(true);
    const result = await submitAppFeedback({
      category: feedbackCategory,
      message: feedbackMessage.trim(),
      contact: feedbackContact.trim() || undefined,
      app_version: remoteSettings.latest_version || '1.0.5',
      device_platform: Platform.OS,
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsFeedbackModalVisible(false);
      setFeedbackMessage('');
      setFeedbackContact('');
      Alert.alert(t.feedback_success_title, t.feedback_success_msg);
    } else {
      Alert.alert(t.alert_error, result.error || t.alert_error);
    }
  };

  return {
    insets,
    articles,
    bookmarks,
    searchHistory,
    readArticles,
    settings,
    remoteSettings,
    colors,
    scale,
    isDark,
    setThemeMode,
    setFontSize,
    setCardLayout,
    setAiReaderEnabled,
    setLinkOpenMode,
    setDataSaverEnabled,
    clearNewsCache,
    clearBookmarks,
    clearReadArticles,
    clearSearchHistory,
    syncCloudBookmarks,
    isSyncingBookmarks,
    importBookmarksFromDevice,
    isCloudSyncActive,
    setCloudSyncEnabled,
    language,
    resolvedLanguage,
    setLanguage,
    t,

    deviceId,
    isManualSyncing,
    isImportModalVisible,
    setIsImportModalVisible,
    targetDeviceId,
    setTargetDeviceId,
    isImporting,
    isFeedbackModalVisible,
    setIsFeedbackModalVisible,
    feedbackCategory,
    setFeedbackCategory,
    feedbackMessage,
    setFeedbackMessage,
    feedbackContact,
    setFeedbackContact,
    isSubmitting,
    isThemeDropdownOpen,
    toggleThemeDropdown,
    closeThemeDropdown,
    handleManualSync,
    handleShareDeviceId,
    handleImportBookmarks,
    handleSubmitFeedback,

    readCount,
    historyCount,
    bookmarkCount,
    cacheCount,
  };
}
