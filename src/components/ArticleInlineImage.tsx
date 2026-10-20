import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppColors, typography } from '../theme';

export interface ArticleInlineImageProps {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  index: number;
  onPress: () => void;
  colors: AppColors;
  isDark: boolean;
  scale: number;
  dataSaverEnabled?: boolean;
}

export const ArticleInlineImage = memo(function ArticleInlineImage({
  url,
  alt,
  caption,
  width,
  height,
  aspectRatio,
  index,
  onPress,
  colors,
  isDark,
  scale,
  dataSaverEnabled = false,
}: ArticleInlineImageProps) {
  const [calculatedRatio, setCalculatedRatio] = useState<number>(() => {
    if (aspectRatio && aspectRatio > 0) return aspectRatio;
    if (width && height && width > 0 && height > 0) {
      return Math.max(0.65, Math.min(2.5, width / height));
    }
    return 16 / 9;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [userLoadedInSaver, setUserLoadedInSaver] = useState(false);

  // Dynamically calculate natural aspect ratio if not provided by HTML attributes
  useEffect(() => {
    if (!aspectRatio && (!width || !height) && url) {
      let isMounted = true;
      Image.getSize(
        url,
        (w, h) => {
          if (isMounted && w > 0 && h > 0) {
            const ratio = Math.max(0.65, Math.min(2.5, w / h));
            setCalculatedRatio(ratio);
          }
        },
        () => {
          // If getSize fails, keep default 16/9
        },
      );
      return () => {
        isMounted = false;
      };
    }
  }, [url, width, height, aspectRatio]);

  if (hasError) {
    return null;
  }

  // Data saver mode placeholder
  if (dataSaverEnabled && !userLoadedInSaver) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
            borderColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => setUserLoadedInSaver(true)}
          style={[styles.dataSaverButton, { backgroundColor: colors.surface }]}
          accessibilityLabel="โหมดประหยัดข้อมูล: แตะเพื่อโหลดรูปภาพ"
        >
          <MaterialCommunityIcons name="image-outline" size={24} color={colors.primary} />
          <Text style={[styles.dataSaverText, { color: colors.text, fontSize: 13 * scale }]}>
            แตะเพื่อโหลดรูปภาพ (โหมดประหยัดข้อมูล)
          </Text>
        </Pressable>
        {(caption || alt) && (
          <Text style={[styles.captionText, { color: colors.muted, fontSize: 11.5 * scale }]}>
            {caption || alt}
          </Text>
        )}
      </View>
    );
  }

  const captionText = (caption || alt || '').trim();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={[
          styles.imageCard,
          {
            aspectRatio: calculatedRatio,
            backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
        accessibilityLabel={captionText ? `รูปภาพ: ${captionText}` : 'แตะเพื่อดูภาพขนาดเต็ม'}
        accessibilityRole="imagebutton"
      >
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Tap to Zoom Badge */}
        <View style={styles.zoomBadge}>
          <MaterialCommunityIcons name="magnify-plus" size={13} color="#FFFFFF" />
          <Text style={styles.zoomText}>แตะดูภาพเต็ม</Text>
        </View>
      </Pressable>

      {/* Caption & Alt Text Row */}
      {captionText.length > 0 && (
        <View style={styles.captionRow}>
          <MaterialCommunityIcons name="camera-outline" size={13} color={colors.muted} />
          <Text
            style={[
              styles.captionText,
              {
                color: colors.muted,
                fontSize: 12 * scale,
                fontFamily: typography.fontFamily,
              },
            ]}
          >
            {captionText}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    width: '100%',
  },
  imageCard: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  zoomText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    gap: 6,
  },
  captionText: {
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  dataSaverButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dataSaverText: {
    fontWeight: '600',
  },
});
