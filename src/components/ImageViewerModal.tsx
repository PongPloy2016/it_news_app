import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

const MIN_SCALE = 1.0;
const MAX_SCALE = 4.5;

export function ImageViewerModal({
  visible,
  images,
  initialIndex = 0,
  onClose,
  onIndexChange,
}: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);

  // Animated values for 60fps hardware-accelerated transforms
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Numerical tracker refs
  const currentScale = useRef(1);
  const currentTranslateX = useRef(0);
  const currentTranslateY = useRef(0);

  // Pinch & Pan multi-touch tracking
  const pinchRef = useRef({
    isPinching: false,
    startDistance: 0,
    startScale: 1,
    startFocal: { x: 0, y: 0 },
    startTranslate: { x: 0, y: 0 },
  });

  const singleTouchRef = useRef({
    startX: 0,
    startY: 0,
    startTranslate: { x: 0, y: 0 },
  });

  const lastTapTime = useRef(0);

  // Latest prop/state refs for stable PanResponder callbacks
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const imagesRef = useRef(images);
  imagesRef.current = images;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;

  // Handle window dimensions resize
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => sub.remove();
  }, []);

  // Sync initialIndex and reset on show
  useEffect(() => {
    if (visible) {
      const validIndex = Math.max(0, Math.min(initialIndex, images.length - 1));
      setCurrentIndex(validIndex);
      setIsLoading(true);
      setHasError(false);
      resetZoomImmediate();
    }
  }, [visible, initialIndex, images.length]);

  // Notify parent component of current image index
  useEffect(() => {
    if (visible) {
      onIndexChange?.(currentIndex);
    }
  }, [visible, currentIndex, onIndexChange]);

  // Handle Android hardware back button
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onCloseRef.current();
      return true;
    });
    return () => backHandler.remove();
  }, [visible]);

  // Reset transforms immediately without animation
  const resetZoomImmediate = useCallback(() => {
    currentScale.current = 1;
    currentTranslateX.current = 0;
    currentTranslateY.current = 0;
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    setZoomPercent(100);
  }, [scale, translateX, translateY]);

  // Snap translation within scale boundaries with spring animation
  const snapTranslationsToBounds = useCallback(() => {
    const maxTx = Math.max(0, ((currentScale.current - 1) * screenWidth) / 2);
    const maxTy = Math.max(0, ((currentScale.current - 1) * screenHeight) / 2);

    const targetTx = Math.max(-maxTx, Math.min(currentTranslateX.current, maxTx));
    const targetTy = Math.max(-maxTy, Math.min(currentTranslateY.current, maxTy));

    currentTranslateX.current = targetTx;
    currentTranslateY.current = targetTy;

    Animated.parallel([
      Animated.spring(translateX, { toValue: targetTx, useNativeDriver: true, bounciness: 3 }),
      Animated.spring(translateY, { toValue: targetTy, useNativeDriver: true, bounciness: 3 }),
    ]).start();
  }, [screenWidth, screenHeight, translateX, translateY]);

  // Smoothly animate zoom and pan to target scale
  const zoomTo = useCallback(
    (targetScale: number, animated = true) => {
      const clampedScale = Math.max(MIN_SCALE, Math.min(targetScale, MAX_SCALE));
      currentScale.current = clampedScale;
      setZoomPercent(Math.round(clampedScale * 100));

      if (clampedScale <= 1.05) {
        currentTranslateX.current = 0;
        currentTranslateY.current = 0;
        if (animated) {
          Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 2 }),
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 2 }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 2 }),
          ]).start();
        } else {
          resetZoomImmediate();
        }
      } else {
        const maxTx = ((clampedScale - 1) * screenWidth) / 2;
        const maxTy = ((clampedScale - 1) * screenHeight) / 2;
        const targetTx = Math.max(-maxTx, Math.min(currentTranslateX.current, maxTx));
        const targetTy = Math.max(-maxTy, Math.min(currentTranslateY.current, maxTy));

        currentTranslateX.current = targetTx;
        currentTranslateY.current = targetTy;

        if (animated) {
          Animated.parallel([
            Animated.spring(scale, { toValue: clampedScale, useNativeDriver: true, bounciness: 2 }),
            Animated.spring(translateX, { toValue: targetTx, useNativeDriver: true, bounciness: 2 }),
            Animated.spring(translateY, { toValue: targetTy, useNativeDriver: true, bounciness: 2 }),
          ]).start();
        } else {
          scale.setValue(clampedScale);
          translateX.setValue(targetTx);
          translateY.setValue(targetTy);
        }
      }
    },
    [scale, translateX, translateY, screenWidth, screenHeight, resetZoomImmediate],
  );

  const handleZoomIn = useCallback(() => {
    zoomTo(currentScale.current + 0.5, true);
  }, [zoomTo]);

  const handleZoomOut = useCallback(() => {
    zoomTo(currentScale.current - 0.5, true);
  }, [zoomTo]);

  const handleReset = useCallback(() => {
    zoomTo(1, true);
  }, [zoomTo]);

  const goToNextImage = useCallback(() => {
    if (currentIndexRef.current < imagesRef.current.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsLoading(true);
      setHasError(false);
      resetZoomImmediate();
    }
  }, [resetZoomImmediate]);

  const goToPrevImage = useCallback(() => {
    if (currentIndexRef.current > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsLoading(true);
      setHasError(false);
      resetZoomImmediate();
    }
  }, [resetZoomImmediate]);

  const handleDoubleTap = useCallback(() => {
    if (currentScale.current > 1.2) {
      zoomTo(1, true);
    } else {
      zoomTo(2.5, true);
    }
  }, [zoomTo]);

  // Robust Multi-touch PanResponder for Pinch-to-Zoom, Pan, and Double-Tap
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            const [t1, t2] = touches;
            const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
            pinchRef.current = {
              isPinching: true,
              startDistance: Math.max(dist, 1),
              startScale: currentScale.current,
              startFocal: {
                x: (t1.pageX + t2.pageX) / 2,
                y: (t1.pageY + t2.pageY) / 2,
              },
              startTranslate: {
                x: currentTranslateX.current,
                y: currentTranslateY.current,
              },
            };
          } else if (touches.length === 1) {
            pinchRef.current.isPinching = false;
            singleTouchRef.current = {
              startX: touches[0].pageX,
              startY: touches[0].pageY,
              startTranslate: {
                x: currentTranslateX.current,
                y: currentTranslateY.current,
              },
            };
          }
        },

        onPanResponderMove: (evt) => {
          const touches = evt.nativeEvent.touches;

          // 1. PINCH ZOOM: 2 or more fingers active
          if (touches.length >= 2) {
            const [t1, t2] = touches;
            const currentDist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);

            // Dynamically initialize pinch session if second finger arrived during move
            if (!pinchRef.current.isPinching || pinchRef.current.startDistance === 0) {
              pinchRef.current = {
                isPinching: true,
                startDistance: Math.max(currentDist, 1),
                startScale: currentScale.current,
                startFocal: {
                  x: (t1.pageX + t2.pageX) / 2,
                  y: (t1.pageY + t2.pageY) / 2,
                },
                startTranslate: {
                  x: currentTranslateX.current,
                  y: currentTranslateY.current,
                },
              };
              return;
            }

            // Real-time pinch zoom calculation with rubber-banding
            const scaleFactor = currentDist / pinchRef.current.startDistance;
            const targetScale = pinchRef.current.startScale * scaleFactor;
            const newScale = Math.max(0.75, Math.min(targetScale, MAX_SCALE + 1.0));

            currentScale.current = newScale;
            scale.setValue(newScale);
            setZoomPercent(Math.round(newScale * 100));

            // Pan with focal point during pinch
            const currentFocalX = (t1.pageX + t2.pageX) / 2;
            const currentFocalY = (t1.pageY + t2.pageY) / 2;
            const deltaFocalX = currentFocalX - pinchRef.current.startFocal.x;
            const deltaFocalY = currentFocalY - pinchRef.current.startFocal.y;

            const nextTx = pinchRef.current.startTranslate.x + deltaFocalX;
            const nextTy = pinchRef.current.startTranslate.y + deltaFocalY;

            currentTranslateX.current = nextTx;
            currentTranslateY.current = nextTy;
            translateX.setValue(nextTx);
            translateY.setValue(nextTy);
            return;
          }

          // 2. SINGLE TOUCH (1 finger active)
          if (touches.length === 1) {
            // Smoothly transition from pinch to 1-finger pan if 1 finger lifted
            if (pinchRef.current.isPinching) {
              pinchRef.current.isPinching = false;
              singleTouchRef.current = {
                startX: touches[0].pageX,
                startY: touches[0].pageY,
                startTranslate: {
                  x: currentTranslateX.current,
                  y: currentTranslateY.current,
                },
              };
              return;
            }

            if (currentScale.current > 1.05) {
              // Zoomed-in pan with boundaries
              const deltaX = touches[0].pageX - singleTouchRef.current.startX;
              const deltaY = touches[0].pageY - singleTouchRef.current.startY;
              const nextX = singleTouchRef.current.startTranslate.x + deltaX;
              const nextY = singleTouchRef.current.startTranslate.y + deltaY;

              const maxTx = ((currentScale.current - 1) * screenWidth) / 2;
              const maxTy = ((currentScale.current - 1) * screenHeight) / 2;

              const clampedX = Math.max(-maxTx - 50, Math.min(nextX, maxTx + 50));
              const clampedY = Math.max(-maxTy - 50, Math.min(nextY, maxTy + 50));

              currentTranslateX.current = clampedX;
              currentTranslateY.current = clampedY;
              translateX.setValue(clampedX);
              translateY.setValue(clampedY);
            } else {
              // Scale ~1.0: vertical pull down to dismiss preview
              const deltaY = touches[0].pageY - singleTouchRef.current.startY;
              if (deltaY > 0) {
                translateY.setValue(deltaY * 0.7);
              }
            }
          }
        },

        onPanResponderRelease: (evt, gestureState) => {
          const hadPinch = pinchRef.current.isPinching;
          pinchRef.current.isPinching = false;
          pinchRef.current.startDistance = 0;

          const now = Date.now();
          const isTap = Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8;

          // Double Tap check
          if (isTap && !hadPinch) {
            if (now - lastTapTime.current < 280) {
              handleDoubleTap();
              lastTapTime.current = 0;
              return;
            }
            lastTapTime.current = now;
            return;
          }

          // If pinch just ended, restore scale and clamp bounds
          if (hadPinch) {
            if (currentScale.current < MIN_SCALE) {
              zoomTo(MIN_SCALE, true);
              return;
            }
            if (currentScale.current > MAX_SCALE) {
              zoomTo(MAX_SCALE, true);
              return;
            }
            snapTranslationsToBounds();
            return;
          }

          // If zoomed in and panned, snap to bounds
          if (currentScale.current > 1.05) {
            snapTranslationsToBounds();
            return;
          }

          // Unzoomed state
          // 1. Swipe down to dismiss
          if (gestureState.dy > 90 && Math.abs(gestureState.dx) < 80) {
            onCloseRef.current();
            return;
          } else {
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
          }

          // 2. Horizontal swipe to switch photo
          if (imagesRef.current.length > 1) {
            if (gestureState.dx < -50 && currentIndexRef.current < imagesRef.current.length - 1) {
              goToNextImage();
            } else if (gestureState.dx > 50 && currentIndexRef.current > 0) {
              goToPrevImage();
            }
          }
        },
      }),
    [screenWidth, screenHeight, handleDoubleTap, zoomTo, snapTranslationsToBounds, goToNextImage, goToPrevImage],
  );

  if (!visible || images.length === 0) {
    return null;
  }

  const currentUri = images[currentIndex] || '';
  const hasMultipleImages = images.length > 1;
  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight ?? 0, 16)
      : Math.max(insets.top, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      hardwareAccelerated
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Header Bar */}
        <View style={[styles.header, { paddingTop: topInset }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Photo Counter */}
          {hasMultipleImages ? (
            <View style={styles.counterPill}>
              <MaterialCommunityIcons name="image-multiple-outline" size={14} color="#FFFFFF" />
              <Text style={styles.counterText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          ) : (
            <View style={styles.counterPill}>
              <MaterialCommunityIcons name="image-outline" size={14} color="#FFFFFF" />
              <Text style={styles.counterText}>รูปภาพข่าว</Text>
            </View>
          )}

          {/* Reset Zoom Button in Header */}
          <TouchableOpacity
            style={[styles.headerButton, zoomPercent === 100 && styles.headerButtonDisabled]}
            onPress={handleReset}
            disabled={zoomPercent === 100}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="fit-to-screen-outline"
              size={20}
              color={zoomPercent === 100 ? '#64748B' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Main Image Stage - captures all multi-touch pinch and pan gestures */}
        <View style={styles.imageStage} {...panResponder.panHandlers}>
          {isLoading && !hasError && (
            <View style={styles.loaderWrap} pointerEvents="none">
              <ActivityIndicator size="large" color="#38BDF8" />
            </View>
          )}

          {hasError ? (
            <View style={styles.errorWrap} pointerEvents="none">
              <MaterialCommunityIcons name="image-broken-variant" size={54} color="#64748B" />
              <Text style={styles.errorText}>ไม่สามารถโหลดรูปภาพนี้ได้</Text>
            </View>
          ) : (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.imageContainer,
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { scale },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: currentUri }}
                style={[styles.fullImage, { width: screenWidth, height: screenHeight * 0.72 }]}
                resizeMode="contain"
                onLoadEnd={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            </Animated.View>
          )}
        </View>

        {/* Floating Side Arrow: Previous */}
        {hasMultipleImages && currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowLeft]}
            onPress={goToPrevImage}
            activeOpacity={0.8}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Floating Side Arrow: Next */}
        {hasMultipleImages && currentIndex < images.length - 1 && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowRight]}
            onPress={goToNextImage}
            activeOpacity={0.8}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <MaterialCommunityIcons name="chevron-right" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Bottom Floating Control Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Zoom Controls Pill */}
          <View style={styles.zoomControlPill}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={handleZoomOut}
              disabled={currentScale.current <= MIN_SCALE}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="magnify-minus-outline"
                size={22}
                color={currentScale.current <= MIN_SCALE ? '#64748B' : '#FFFFFF'}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.zoomPercentBadge} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.zoomPercentText}>{zoomPercent}%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={handleZoomIn}
              disabled={currentScale.current >= MAX_SCALE}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="magnify-plus-outline"
                size={22}
                color={currentScale.current >= MAX_SCALE ? '#64748B' : '#FFFFFF'}
              />
            </TouchableOpacity>

            <View style={styles.pillDivider} />

            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="restart" size={20} color="#38BDF8" />
            </TouchableOpacity>
          </View>

          {/* Dots Indicator if multiple images */}
          {hasMultipleImages && (
            <View style={styles.dotsContainer}>
              {images.map((_, idx) => (
                <TouchableOpacity
                  key={`dot-${idx}`}
                  onPress={() => {
                    setCurrentIndex(idx);
                    setIsLoading(true);
                    setHasError(false);
                    resetZoomImmediate();
                  }}
                  activeOpacity={0.6}
                  style={[
                    styles.dot,
                    currentIndex === idx ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          )}

          {/* User hint */}
          <Text style={styles.hintText}>
            ใช้ 2 นิ้วบีบ/ถ่างเพื่อซูม หรือแตะ 2 ครั้งติดกัน
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#090D14',
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  counterPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  imageStage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    maxWidth: '100%',
  },
  loaderWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  errorWrap: {
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  arrowButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -22 }],
    width: 44,
    zIndex: 8,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  bottomBar: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  zoomControlPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
    }),
  },
  zoomBtn: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  zoomPercentBadge: {
    minWidth: 54,
    paddingHorizontal: 4,
  },
  zoomPercentText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  pillDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    height: 20,
    marginHorizontal: 4,
    width: 1,
  },
  dotsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 2,
  },
  dot: {
    borderRadius: 4,
    height: 6,
  },
  activeDot: {
    backgroundColor: '#38BDF8',
    width: 18,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    width: 6,
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
  },
});
