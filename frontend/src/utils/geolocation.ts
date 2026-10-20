/**
 * Frontend Geolocation Utilities
 * Adheres to AgroRent Privacy & Location guidelines:
 * - Collects location only when explicitly triggered by the user
 * - Explains purpose
 * - Handles errors gracefully
 */

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const requestCurrentLocation = (): Promise<GeoLocationResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error('Geolocation is not supported by your browser. Please enter your location manually.')
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              'Location permission was denied. Please allow location access in your browser settings, or enter your address manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            message =
              'Location information is currently unavailable. Please verify GPS is enabled or enter your address.';
            break;
          case error.TIMEOUT:
            message = 'The request to get your location timed out. Please try again.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  });
};

/**
 * Client-side Haversine distance calculator
 */
export const calculateDistanceKm = (
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null => {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return null;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
};
