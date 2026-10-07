import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

let inMemoryDeviceId: string | null = null;

function generateRandomDeviceId(): string {
  const timePart = Date.now().toString(36);
  const randPart = Math.random().toString(36).substring(2, 12);
  const randPart2 = Math.random().toString(36).substring(2, 10);
  return `dev_${timePart}_${randPart}_${randPart2}`;
}

/**
 * Retrieves or initializes a persistent unique device ID for this installation.
 * Used for anonymous cloud sync with Supabase tables without mandatory login.
 */
export async function getDeviceId(): Promise<string> {
  if (inMemoryDeviceId) {
    return inMemoryDeviceId;
  }

  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
    if (existing && existing.trim().length > 0) {
      inMemoryDeviceId = existing.trim();
      return inMemoryDeviceId;
    }

    const newId = generateRandomDeviceId();
    await AsyncStorage.setItem(STORAGE_KEYS.deviceId, newId);
    inMemoryDeviceId = newId;
    return newId;
  } catch (err) {
    console.warn('[deviceIdService] Failed to access AsyncStorage for deviceId:', err);
    if (!inMemoryDeviceId) {
      inMemoryDeviceId = generateRandomDeviceId();
    }
    return inMemoryDeviceId;
  }
}
