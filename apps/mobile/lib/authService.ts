import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from './config';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
};

export async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    const response = await fetch(`${config.server.url}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;
    const data = await response.json();
    if (data?.success && data?.data?.token && data?.data?.refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function decodeJwtPayload(token: string): any | null {
  try {
    const [, payload] = token.split('.');
    const json = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function ensureFreshToken(thresholdSeconds: number = 60): Promise<void> {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (!token) return;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now + thresholdSeconds) {
    await refreshTokens();
  }
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  await ensureFreshToken();
  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
}


