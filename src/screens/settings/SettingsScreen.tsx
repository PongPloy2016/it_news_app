import { ScrollView } from 'react-native';
import { BrandHeader } from './components/BrandHeader';
import { CloudSyncSection } from './components/CloudSyncSection';
import { DisplaySection } from './components/DisplaySection';
import { FeedbackModal } from './components/FeedbackModal';
import { LinkDeviceModal } from './components/LinkDeviceModal';
import { ReadingSection } from './components/ReadingSection';
import { StorageSection } from './components/StorageSection';
import { SupportSection } from './components/SupportSection';
import { styles } from './styles';
import { useSettingsViewModel } from './useSettingsViewModel';

export function SettingsScreen() {
  const vm = useSettingsViewModel();

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 150 + vm.insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. App Identity Header Banner & Announcement */}
        <BrandHeader vm={vm} />

        {/* 2. Group 1: Display & Language */}
        <DisplaySection vm={vm} />

        {/* 3. Group 2: Reading & Performance */}
        <ReadingSection vm={vm} />

        {/* 4. Group 3: Cloud & Storage */}
        <CloudSyncSection vm={vm} />
        <StorageSection vm={vm} />

        {/* 5. Group 4: Support & About */}
        <SupportSection vm={vm} />
      </ScrollView>

      {/* Modals */}
      <FeedbackModal vm={vm} />
      <LinkDeviceModal vm={vm} />
    </>
  );
}
