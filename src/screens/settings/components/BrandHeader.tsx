import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';
import { styles } from '../styles';
import { SettingsViewModel } from '../types';

interface BrandHeaderProps {
  vm: SettingsViewModel;
}

export function BrandHeader({ vm }: BrandHeaderProps) {
  const { colors, scale, isDark, remoteSettings, t } = vm;

  return (
    <>
      {/* 1. App Identity Header Banner (Clean, Lightweight & Vibrant with Official Logo) */}
      <View
        style={[
          styles.brandBanner,
          {
            backgroundColor: isDark ? '#141722' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View
          style={[
            styles.brandLogoWrap,
            {
              backgroundColor: isDark ? '#1E2333' : '#F1F5F9',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.brandLogoImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.brandTextCol}>
          <View style={styles.brandTopRow}>
            <Text style={[styles.brandTitle, { color: colors.text, fontSize: 17.5 * scale }]}>
              TechThaiNews
            </Text>
            <View
              style={[
                styles.brandVersionPill,
                {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#BFDBFE',
                },
              ]}
            >
              <View style={styles.brandLiveDot} />
              <Text style={[styles.brandVersionText, { color: colors.primary, fontSize: 11 * scale }]}>
                v{remoteSettings.latest_version || '1.0.5'}
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={2}
            style={[styles.brandTagline, { color: colors.muted, fontSize: 11.5 * scale }]}
          >
            {t.brand_tagline}
          </Text>
        </View>
      </View>

      {/* 2. Global Announcement Banner (if active from Supabase) */}
      {remoteSettings.announcement_active && remoteSettings.announcement_message && (
        <View
          style={[
            styles.announcementCard,
            {
              backgroundColor: isDark ? '#1A233A' : '#EFF6FF',
              borderColor: isDark ? '#2563EB' : '#93C5FD',
            },
          ]}
        >
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.announcementIconWrap}
          >
            <MaterialCommunityIcons name="bullhorn-outline" size={17} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.announcementTitle, { color: isDark ? '#93C5FD' : '#1D4ED8', fontSize: 13.5 * scale }]}>
              {t.announcement_title}
            </Text>
            <Text style={[styles.announcementDesc, { color: isDark ? '#E2E8F0' : '#1E3A8A', fontSize: 12.5 * scale }]}>
              {remoteSettings.announcement_message}
            </Text>
          </View>
        </View>
      )}
    </>
  );
}
