import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiRequest } from './api';

export async function registerPushToken(authToken: string | null) {
  if (!authToken || Platform.OS === 'web') return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync();
    await apiRequest(
      '/notifications/register-device',
      {
        method: 'POST',
        body: JSON.stringify({
          token: pushToken.data,
          platform: Platform.OS,
        }),
      },
      authToken,
    );
  } catch {
    // Expo push tokens require a physical device or configured projectId
  }
}
