/**
 * AgroRent Phase 9 - Geolocation and Distance Utilities
 * Implements Haversine distance formula, coordinate verification,
 * and privacy masking for sensitive residential coordinates.
 */

/**
 * Calculates great-circle distance between two GPS coordinates in kilometers.
 * Uses the Haversine formula on a spherical earth of radius 6371 km.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2) ||
    lat1 < -90 ||
    lat1 > 90 ||
    lat2 < -90 ||
    lat2 > 90 ||
    lon1 < -180 ||
    lon1 > 180 ||
    lon2 < -180 ||
    lon2 > 180
  ) {
    return 0;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (e.g., 12.6 km)
  return Math.round(distance * 10) / 10;
}

/**
 * Validate latitude value (-90 to 90)
 */
export function isValidLatitude(lat: any): boolean {
  const num = typeof lat === 'number' ? lat : parseFloat(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

/**
 * Validate longitude value (-180 to 180)
 */
export function isValidLongitude(lon: any): boolean {
  const num = typeof lon === 'number' ? lon : parseFloat(lon);
  return !isNaN(num) && num >= -180 && num <= 180;
}

/**
 * Masks exact residential GPS coordinates for public search listings
 * Rounds to ~0.01 degrees (~1.1 km precision) to protect owner privacy
 */
export function maskApproximateCoordinates(
  lat?: number | null,
  lon?: number | null
): { latitude?: number | null; longitude?: number | null } {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return { latitude: null, longitude: null };
  }
  return {
    latitude: Math.round(lat * 100) / 100,
    longitude: Math.round(lon * 100) / 100,
  };
}

/**
 * Compute estimated delivery arrival time safely without guessing when not in transit.
 * Average transit speed for agricultural livestock transport is ~35 km/h.
 */
export function calculateDeliveryETA(
  distanceKm: number,
  status: string
): { etaText: string; estimatedMinutes?: number } {
  if (status !== 'OUT_FOR_DELIVERY' && status !== 'IN_TRANSIT') {
    return { etaText: 'ETA unavailable' };
  }

  if (!distanceKm || distanceKm <= 0) {
    return { etaText: 'Arriving soon', estimatedMinutes: 5 };
  }

  // Assume conservative 30 km/h average speed in rural/semi-urban roads + 15 min handling
  const travelMinutes = Math.round((distanceKm / 30) * 60) + 10;
  const now = new Date();
  const arrivalDate = new Date(now.getTime() + travelMinutes * 60000);

  const timeString = arrivalDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    etaText: `Today, ${timeString}`,
    estimatedMinutes: travelMinutes,
  };
}
