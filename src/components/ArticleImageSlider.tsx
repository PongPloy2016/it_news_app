import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { ImageViewerModal } from './ImageViewerModal';

interface Props {
  images?: string[];
  fallbackImageUrl?: string;
}

export function ArticleImageSlider({ images, fallbackImageUrl }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // Consolidate & strictly sanitize valid article images
  const rawImages = images && images.length > 0 ? images : fallbackImageUrl ? [fallbackImageUrl] : [];
  const validImages = rawImages
    .filter((url): url is string => Boolean(url && typeof url === 'string'))
    .map((url) => url.trim())
    .filter((url) => {
      // Must be absolute http/https
      if (!/^https?:\/\//i.test(url)) return false;
      // Filter layout/tracking/job ad artifacts
      if (
        /badge|banner|gtag|doubleclick|feedburner|feedsportal|statcounter|avatar|gravatar|defaultcover|\/jobs\//i.test(
          url,
        )
      ) {
        return false;
      }
      return true;
    })
    .slice(0, 6); // Max 6 photos in carousel

  if (validImages.length === 0) {
    return null;
  }

  // Single Image view
  if (validImages.length === 1) {
    if (failedIndices[0]) return null;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.touchableSlide}
          onPress={() => {
            setViewerInitialIndex(0);
            setViewerVisible(true);
          }}
        >
          <Image
            source={{ uri: validImages[0] }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setFailedIndices((prev) => ({ ...prev, 0: true }))}
          />
          <View style={styles.counterBadge}>
            <MaterialCommunityIcons name="magnify-plus-outline" size={13} color="#FFFFFF" />
            <Text style={styles.counterText}>แตะเพื่อดูรูป / ซูม</Text>
          </View>
        </TouchableOpacity>

        <ImageViewerModal
          visible={viewerVisible}
          images={validImages}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerVisible(false)}
        />
      </View>
    );
  }

  // Multiple Images - Interactive Slide Carousel
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index >= 0 && index < validImages.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={styles.scroll}
      >
        {validImages.map((uri, idx) => (
          <View key={`${uri}-${idx}`} style={[styles.slideItem, { width: screenWidth }]}>
            {!failedIndices[idx] ? (
              <TouchableOpacity
                activeOpacity={0.92}
                style={styles.touchableSlide}
                onPress={() => {
                  setViewerInitialIndex(idx);
                  setViewerVisible(true);
                }}
              >
                <Image
                  source={{ uri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => setFailedIndices((prev) => ({ ...prev, [idx]: true }))}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.errorPlaceholder}>
                <MaterialCommunityIcons name="image-broken-variant" size={32} color="#94A3B8" />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Floating Counter Badge */}
      <TouchableOpacity
        style={styles.counterBadge}
        activeOpacity={0.8}
        onPress={() => {
          setViewerInitialIndex(activeIndex);
          setViewerVisible(true);
        }}
      >
        <MaterialCommunityIcons name="magnify-plus-outline" size={13} color="#FFFFFF" />
        <Text style={styles.counterText}>
          {activeIndex + 1} / {validImages.length}
        </Text>
      </TouchableOpacity>

      {/* Dots Indicator (shown when <= 6 images) */}
      {validImages.length <= 6 && (
        <View style={styles.dotsWrap} pointerEvents="none">
          {validImages.map((_, idx) => (
            <View
              key={`dot-${idx}`}
              style={[styles.dot, activeIndex === idx ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>
      )}

      {/* Fullscreen Zoomable Image Viewer Modal */}
      <ImageViewerModal
        visible={viewerVisible}
        images={validImages}
        initialIndex={viewerInitialIndex}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2E8F0',
    height: 250,
    position: 'relative',
    width: '100%',
  },
  scroll: {
    height: '100%',
    width: '100%',
  },
  slideItem: {
    backgroundColor: '#E2E8F0',
    height: '100%',
  },
  touchableSlide: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  errorPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  counterBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    bottom: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    position: 'absolute',
    right: 12,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  dotsWrap: {
    alignItems: 'center',
    bottom: 12,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  dot: {
    borderRadius: 3,
    height: 6,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    width: 6,
  },
});
