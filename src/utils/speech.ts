import { isThaiText } from './aiSummary';

export type SpeechRate = 0.9 | 1.1 | 1.35;

export interface SpeechOptions {
  rate?: SpeechRate;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: unknown) => void;
}

let activeSpeechCallback: (() => void) | null = null;

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
    const Speech = getSpeechModule();
    if (!Speech) return false;
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  try {
    const Speech = getSpeechModule();
    if (Speech) {
      Speech.stop();
    }
  } catch {
    // Best-effort
  }
  if (activeSpeechCallback) {
    activeSpeechCallback();
    activeSpeechCallback = null;
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

export function speakArticleText(text: string, options?: SpeechOptions): void {
  stopSpeaking();

  const isThai = isThaiText(text);
  const lang = isThai ? 'th-TH' : 'en-US';
  const rate = options?.rate ?? (isThai ? 1.0 : 1.0);

  activeSpeechCallback = options?.onStopped ?? null;

  try {
    const Speech = getSpeechModule();
    if (!Speech || typeof Speech.speak !== 'function') {
      throw new Error('Native speech module is not available in current build');
    }

    options?.onStart?.();

    Speech.speak(text, {
      language: lang,
      pitch: 1.0,
      rate: rate,
      onDone: () => {
        activeSpeechCallback = null;
        options?.onDone?.();
      },
      onStopped: () => {
        activeSpeechCallback = null;
        options?.onStopped?.();
      },
      onError: (err) => {
        activeSpeechCallback = null;
        options?.onError?.(err);
      },
    });
  } catch (err) {
    activeSpeechCallback = null;
    options?.onError?.(err);
  }
}
