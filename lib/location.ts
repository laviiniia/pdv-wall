import * as Location from 'expo-location';

export type Coordinates = { lat: number; lng: number };

const GEO_RADIUS_KM = 0.2;

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isFarFromRestaurant(user: Coordinates, restaurant: Coordinates): boolean {
  return haversineKm(user, restaurant) > GEO_RADIUS_KM;
}

export async function requestUserLocation(): Promise<Coordinates | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
  };
}
