import { isThaiText } from './aiSummary';

export type SpeechRate = 0.9 | 1.1 | 1.35;

export interface SpeechOptions {
  rate?: SpeechRate;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: unknown) => void;
}

let activeSpeechSessionId = 0;
let activeSpeechCallback: (() => void) | null = null;
let chunkDelayTimeout: ReturnType<typeof setTimeout> | null = null;
let isSessionActive = false;

function getSpeechModule(): typeof import('expo-speech') | null {
  try {
    // Dynamically require so missing native module never crashes app bundle
    const mod = require('expo-speech');
    return mod;
  } catch {
    return null;
  }
}

export async function isSpeaking(): Promise<boolean> {
  try {
    if (isSessionActive) return true;
    const Speech = getSpeechModule();
    if (!Speech) return false;
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  activeSpeechSessionId++;
  isSessionActive = false;
  if (chunkDelayTimeout) {
    clearTimeout(chunkDelayTimeout);
    chunkDelayTimeout = null;
  }
  try {
    const Speech = getSpeechModule();
    if (Speech) {
      Speech.stop();
    }
  } catch {
    // Best-effort
  }
  if (activeSpeechCallback) {
    const cb = activeSpeechCallback;
    activeSpeechCallback = null;
    cb();
  }
}

export function isSpeechSupported(): boolean {
  try {
    const Speech = getSpeechModule();
    return Boolean(Speech && typeof Speech.speak === 'function');
  } catch {
    return false;
  }
}

/**
 * Strips emojis, bullets, and unsupported TTS characters to prevent native TTS crashes
 */
export function cleanSpeechText(text: string): string {
  return text
    // Emojis and miscellaneous symbols
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, ' ')
    // Bullets, stars, and decorative markers
    .replace(/[•●▪■◆★☆*#_~`^|\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits text into small, natural sentence-based chunks (~200 characters)
 * to avoid native Android/iOS TTS buffer limits and timeouts.
 */
export function splitIntoSpeechChunks(text: string, maxLen = 220): string[] {
  const cleaned = cleanSpeechText(text);
  if (!cleaned) return [];

  const paragraphs = cleaned
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (const para of paragraphs) {
    // Split by sentence delimiters or Thai connector phrases
    const parts = para
      .split(/(?<=[.!?ฯ])\s+|\s+(?:โดย|ซึ่ง|พร้อม|ทั้งนี้|นอกจากนี้|สำหรับ|รวมถึง)\s+/)
      .map((p) => p.trim())
      .filter(Boolean);

    let current = '';

    for (const part of parts) {
      if ((current + ' ' + part).trim().length <= maxLen) {
        current = current ? `${current} ${part}` : part;
      } else {
        if (current) {
          chunks.push(current.trim());
          current = '';
        }
        if (part.length <= maxLen) {
          current = part;
        } else {
          // If a part exceeds maxLen, split by spaces
          const words = part.split(/\s+/).filter(Boolean);
          for (const word of words) {
            if ((current + ' ' + word).trim().length <= maxLen) {
              current = current ? `${current} ${word}` : word;
            } else {
              if (current) chunks.push(current.trim());
              if (word.length <= maxLen) {
                current = word;
              } else {
                for (let i = 0; i < word.length; i += maxLen) {
                  chunks.push(word.slice(i, i + maxLen));
                }
                current = '';
              }
            }
          }
        }
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Speaks the given text completely by chunking and queuing utterances sequentially.
 */
export function speakArticleText(text: string, options?: SpeechOptions): void {
  stopSpeaking();

  const currentSession = ++activeSpeechSessionId;
  isSessionActive = true;
  const isThai = isThaiText(text);
  const lang = isThai ? 'th-TH' : 'en-US';
  const rate = options?.rate ?? 1.0;

  activeSpeechCallback = () => {
    isSessionActive = false;
    options?.onStopped?.();
  };

  try {
    const Speech = getSpeechModule();
    if (!Speech || typeof Speech.speak !== 'function') {
      isSessionActive = false;
      throw new Error('Native speech module is not available in current build');
    }

    const chunks = splitIntoSpeechChunks(text);
    if (chunks.length === 0) {
      isSessionActive = false;
      activeSpeechCallback = null;
      options?.onDone?.();
      return;
    }

    options?.onStart?.();

    let currentIndex = 0;

    const playNextChunk = () => {
      if (currentSession !== activeSpeechSessionId) {
        return;
      }

      if (currentIndex >= chunks.length) {
        isSessionActive = false;
        activeSpeechCallback = null;
        options?.onDone?.();
        return;
      }

      const chunk = chunks[currentIndex];
      currentIndex++;

      Speech.speak(chunk, {
        language: lang,
        pitch: 1.0,
        rate: rate,
        onDone: () => {
          if (currentSession !== activeSpeechSessionId) return;
          // Short delay between chunks for audio track teardown and natural cadence
          chunkDelayTimeout = setTimeout(() => {
            playNextChunk();
          }, 60);
        },
        onStopped: () => {
          if (currentSession === activeSpeechSessionId) {
            isSessionActive = false;
            activeSpeechCallback = null;
            options?.onStopped?.();
          }
        },
        onError: (err) => {
          if (currentSession === activeSpeechSessionId) {
            isSessionActive = false;
            activeSpeechCallback = null;
            options?.onError?.(err);
          }
        },
      });
    };

    playNextChunk();
  } catch (err) {
    isSessionActive = false;
    activeSpeechCallback = null;
    options?.onError?.(err);
  }
}
