import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNews } from '../store/NewsContext';
import { AiSummaryResult } from '../utils/aiSummary';
import { SpeechRate, isSpeaking, speakArticleText, stopSpeaking } from '../utils/speech';

interface Props {
  summary: AiSummaryResult;
  articleTitle: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  rate?: SpeechRate;
  onRateChange?: (rate: SpeechRate) => void;
}

const RATES: SpeechRate[] = [0.9, 1.1, 1.35];
const RATE_LABELS: Record<number, string> = {
  0.9: '1.0x',
  1.1: '1.25x',
  1.35: '1.5x',
};

function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `~${seconds} วินาที`;
  const mins = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  return remainingSec > 0 ? `~${mins} นาที ${remainingSec} วิ` : `~${mins} นาที`;
}

export function AiReaderCard({
  summary,
  articleTitle,
  isPlaying: controlledIsPlaying,
  onTogglePlay,
  rate: controlledRate,
  onRateChange,
}: Props) {
  const { colors, scale, isDark } = useNews();
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [internalRateIdx, setInternalRateIdx] = useState(0);
  const [waveAnim] = useState(new Animated.Value(0));

  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalPlaying;
  const currentRate = controlledRate !== undefined ? controlledRate : RATES[internalRateIdx];

  // Audio wave animation
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      waveAnim.setValue(0);
    }
    return () => {
      animLoop?.stop();
    };
  }, [isPlaying, waveAnim]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (controlledIsPlaying === undefined) {
        stopSpeaking();
      }
    };
  }, [controlledIsPlaying]);

  const handleTogglePlay = () => {
    if (onTogglePlay) {
      onTogglePlay();
      return;
    }

    if (isPlaying) {
      stopSpeaking();
      setInternalPlaying(false);
    } else {
      setInternalPlaying(true);
      speakArticleText(summary.speechScript, {
        rate: currentRate,
        onDone: () => setInternalPlaying(false),
        onStopped: () => setInternalPlaying(false),
        onError: () => setInternalPlaying(false),
      });
    }
  };

  const handleCycleRate = () => {
    const currentIdx = RATES.indexOf(currentRate);
    const nextIdx = (currentIdx + 1) % RATES.length;
    const nextRate = RATES[nextIdx];

    if (onRateChange) {
      onRateChange(nextRate);
      return;
    }

    setInternalRateIdx(nextIdx);
    if (isPlaying) {
      speakArticleText(summary.speechScript, {
        rate: nextRate,
        onDone: () => setInternalPlaying(false),
        onStopped: () => setInternalPlaying(false),
        onError: () => setInternalPlaying(false),
      });
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#141828' : '#F5F7FF',
          borderColor: isDark ? '#4F46E5' : '#818CF8',
        },
      ]}
    >
      {/* 1. Header: AI Badge & Read Time */}
      <View style={styles.headerRow}>
        <View style={styles.aiBadge}>
          <MaterialCommunityIcons name="creation" size={15} color="#FFFFFF" />
          <Text style={styles.aiBadgeText}>AI SMART SUMMARY</Text>
        </View>

        <View style={styles.timeTag}>
          <MaterialCommunityIcons name="clock-fast" size={13} color={colors.primary} />
          <Text style={[styles.timeTagText, { color: colors.primary, fontSize: 11 * scale }]}>
            สรุป {formatReadingTime(summary.readingTimeSec)}
          </Text>
        </View>
      </View>

      {/* 2. AI Audio Player Bar */}
      <View
        style={[
          styles.playerBar,
          {
            backgroundColor: isDark ? 'rgba(30, 38, 64, 0.8)' : '#FFFFFF',
            borderColor: isPlaying ? '#6366F1' : colors.border,
          },
        ]}
      >
        <Pressable
          hitSlop={8}
          onPress={handleTogglePlay}
          style={[styles.playButton, { backgroundColor: isPlaying ? '#EF4444' : '#6366F1' }]}
        >
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.playerInfo}>
          <Text
            numberOfLines={1}
            style={[styles.playerTitle, { color: colors.text, fontSize: 13.5 * scale }]}
          >
            {isPlaying ? 'กำลังอ่านสรุปด้วยเสียง AI...' : 'ฟัง AI อ่านสรุปข่าว'}
          </Text>

          {/* Sound wave visualizer bars */}
          {isPlaying ? (
            <View style={styles.waveWrap}>
              {[0.4, 0.9, 0.6, 1, 0.7, 0.5, 0.8].map((scaleH, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.waveBar,
                    {
                      height: 14 * scaleH,
                      backgroundColor: '#6366F1',
                      transform: [
                        {
                          scaleY: waveAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.4, scaleH, 0.4],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.playerSubtitle, { color: colors.muted, fontSize: 11 * scale }]}>
              แตะเพื่อฟังเสียงภาษาไทย/อังกฤษ
            </Text>
          )}
        </View>

        {/* Speed Control Button */}
        <Pressable
          hitSlop={8}
          onPress={handleCycleRate}
          style={[styles.rateButton, { backgroundColor: colors.surfaceVariant }]}
        >
          <Text style={[styles.rateText, { color: colors.primary, fontSize: 11.5 * scale }]}>
            {RATE_LABELS[currentRate]}
          </Text>
        </Pressable>

        {isPlaying && (
          <Pressable
            hitSlop={8}
            onPress={() => {
              stopSpeaking();
              if (onTogglePlay) {
                onTogglePlay();
              } else {
                setInternalPlaying(false);
              }
            }}
            style={styles.stopButton}
          >
            <MaterialCommunityIcons name="stop" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* 3. Quick TL;DR */}
      <View style={styles.tldrWrap}>
        <Text style={[styles.tldrTitle, { color: colors.text, fontSize: 14 * scale }]}>
          🎯 ใจความสำคัญ
        </Text>
        <Text style={[styles.tldrText, { color: colors.text, fontSize: 14 * scale, lineHeight: 22 * scale }]}>
          {summary.tldr}
        </Text>
      </View>

      {/* 4. Key Takeaways (Bullet Points) */}
      <View style={styles.pointsWrap}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 14 * scale }]}>
          📌 3-4 ประเด็นสำคัญที่ต้องรู้
        </Text>
        {summary.keyPoints.map((point, index) => (
          <View key={index} style={styles.pointRow}>
            <View style={styles.pointNumberBadge}>
              <Text style={styles.pointNumberText}>{index + 1}</Text>
            </View>
            <Text
              style={[
                styles.pointText,
                { color: colors.text, fontSize: 13.5 * scale, lineHeight: 21 * scale },
              ]}
            >
              {point}
            </Text>
          </View>
        ))}
      </View>

      {/* 5. Key Tags / Extracted Entities */}
      {summary.keyTags.length > 0 && (
        <View style={styles.tagsRow}>
          <Text style={[styles.tagsLabel, { color: colors.muted, fontSize: 11.5 * scale }]}>
            💡 ข้อมูลเด่น:
          </Text>
          {summary.keyTags.map((tag, idx) => (
            <View
              key={idx}
              style={[
                styles.tagChip,
                { backgroundColor: isDark ? '#1E2640' : '#E0E7FF' },
              ]}
            >
              <Text style={[styles.tagChipText, { color: '#4F46E5', fontSize: 11.5 * scale }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 20,
    marginTop: 14,
    padding: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiBadge: {
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  timeTag: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  timeTagText: {
    fontWeight: '700',
  },
  playerBar: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 10,
  },
  playButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  playerTitle: {
    fontWeight: '800',
  },
  playerSubtitle: {
    marginTop: 2,
  },
  waveWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    height: 16,
    marginTop: 4,
  },
  waveBar: {
    borderRadius: 2,
    width: 3,
  },
  rateButton: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  rateText: {
    fontWeight: '800',
  },
  stopButton: {
    marginLeft: 6,
    padding: 4,
  },
  tldrWrap: {
    borderLeftColor: '#6366F1',
    borderLeftWidth: 3.5,
    marginBottom: 14,
    paddingLeft: 10,
  },
  tldrTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  tldrText: {
    fontWeight: '500',
  },
  pointsWrap: {
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  pointRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 9,
  },
  pointNumberBadge: {
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 999,
    height: 18,
    justifyContent: 'center',
    marginTop: 2,
    width: 18,
  },
  pointNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  pointText: {
    flex: 1,
    fontWeight: '500',
  },
  tagsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
    paddingTop: 10,
    borderTopColor: 'rgba(99, 102, 241, 0.15)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tagsLabel: {
    fontWeight: '700',
  },
  tagChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagChipText: {
    fontWeight: '800',
  },
});
