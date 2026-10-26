import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, StyleSheet, Text } from 'react-native';

interface ArticleToastProps {
  message: string | null;
  anim: Animated.Value;
  bottomOffset: number;
}

export function ArticleToast({ message, anim, bottomOffset }: ArticleToastProps) {
  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          bottom: bottomOffset,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <MaterialCommunityIcons name="information" size={17} color="#60A5FA" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.94)',
    borderRadius: 24,
    elevation: 6,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 150,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
