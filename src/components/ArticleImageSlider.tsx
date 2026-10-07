import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // Consolidate, deduplicate & strictly sanitize valid article images
  // Place cover image (fallbackImageUrl) first if available
  const candidateUrls = [
    ...(fallbackImageUrl ? [fallbackImageUrl] : []),
    ...(images || []),
  ];

  const seenUrls = new Set<string>();
  const validImages: string[] = [];

  for (const rawUrl of candidateUrls) {
    if (!rawUrl || typeof rawUrl !== 'string') continue;
    const url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) continue;
    if (
      /badge|banner|gtag|doubleclick|feedburner|feedsportal|statcounter|avatar|gravatar|defaultcover|\/jobs\//i.test(
        url,
      )
    ) {
      continue;
    }
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      validImages.push(url);
      if (validImages.length >= 6) break;
    }
  }

  // Keep scroll position aligned when screen orientation/width changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: activeIndex * screenWidth, animated: false });
  }, [screenWidth, activeIndex]);

  // Handle modal 2-way sync
  const handleIndexChangeFromModal = useCallback(
    (newIndex: number) => {
      if (newIndex >= 0 && newIndex < validImages.length && newIndex !== activeIndex) {
        setActiveIndex(newIndex);
        scrollViewRef.current?.scrollTo({ x: newIndex * screenWidth, animated: false });
      }
    },
    [validImages.length, activeIndex, screenWidth],
  );

  // Handle direct dot press
  const handleDotPress = useCallback(
    (idx: number) => {
      setActiveIndex(idx);
      scrollViewRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
    },
    [screenWidth],
  );

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
          onIndexChange={handleIndexChangeFromModal}
          onClose={() => setViewerVisible(false)}
        />
      </View>
    );
  }

  // Multiple Images - Interactive Slide Carousel
  const updateIndexFromOffset = (offsetX: number) => {
    const index = Math.round(offsetX / screenWidth);
    if (index >= 0 && index < validImages.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    updateIndexFromOffset(event.nativeEvent.contentOffset.x);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    updateIndexFromOffset(event.nativeEvent.contentOffset.x);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
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

      {/* Floating Counter Badge on top-right */}
      <TouchableOpacity
        style={styles.counterBadgeTop}
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

      {/* Tappable Dots Indicator */}
      {validImages.length > 1 && (
        <View style={styles.dotsWrap}>
          {validImages.map((_, idx) => (
            <TouchableOpacity
              key={`dot-${idx}`}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={() => handleDotPress(idx)}
              style={[styles.dot, activeIndex === idx ? styles.activeDot : styles.inactiveDot]}
              accessibilityLabel={`รูปที่ ${idx + 1}`}
            />
          ))}
        </View>
      )}

      {/* Fullscreen Zoomable Image Viewer Modal */}
      <ImageViewerModal
        visible={viewerVisible}
        images={validImages}
        initialIndex={viewerInitialIndex}
        onIndexChange={handleIndexChangeFromModal}
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
  counterBadgeTop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 5,
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
    gap: 6,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 4,
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
