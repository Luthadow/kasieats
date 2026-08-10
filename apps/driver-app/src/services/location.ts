import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Rustenburg town centre — fallback when GPS permission is denied. */
export const RUSTENBURG_FALLBACK: Coordinates = {
  latitude: -25.6544,
  longitude: 27.2389,
};

export async function getCurrentCoords(): Promise<Coordinates> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return RUSTENBURG_FALLBACK;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export async function reportDriverLocation(apiToken: string, apiRequest: typeof import('./api').apiRequest) {
  const coords = await getCurrentCoords();
  await apiRequest(
    '/driver/location',
    {
      method: 'POST',
      body: JSON.stringify(coords),
    },
    apiToken,
  );
  return coords;
}
