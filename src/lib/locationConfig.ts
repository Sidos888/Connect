/**
 * Location configuration for Mapbox geocoding
 * Provides coordinates and bounding boxes for location-based search
 */

export interface LocationConfig {
  center: [number, number]; // [longitude, latitude]
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  name: string;
}

export const LOCATION_CONFIGS: Record<string, LocationConfig> = {
  'Adelaide': {
    center: [138.6007, -34.9285],
    bbox: [138.4, -35.0, 138.7, -34.8],
    name: 'Adelaide'
  },
  'Near me': {
    // Default to Adelaide if GPS not available
    center: [138.6007, -34.9285],
    bbox: [138.4, -35.0, 138.7, -34.8],
    name: 'Adelaide'
  },
  'Anywhere': {
    // No geographic restrictions
    center: [138.6007, -34.9285], // Default center, but won't be used
    bbox: [0, 0, 0, 0], // Will be ignored
    name: 'Anywhere'
  }
};

/**
 * Get location config based on filter selection
 */
export function getLocationConfig(selectedWhere: string | null): LocationConfig {
  const key = selectedWhere || 'Adelaide';
  return LOCATION_CONFIGS[key] || LOCATION_CONFIGS['Adelaide'];
}

/**
 * Get user's current location (GPS)
 * Falls back to Adelaide if permission denied or unavailable
 */
export async function getUserLocation(): Promise<LocationConfig> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return LOCATION_CONFIGS['Adelaide'];
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        // Use a small bounding box around user's location (roughly 10km radius)
        const bbox: [number, number, number, number] = [
          longitude - 0.1, // minLng
          latitude - 0.1,  // minLat
          longitude + 0.1, // maxLng
          latitude + 0.1   // maxLat
        ];
        resolve({
          center: [longitude, latitude],
          bbox,
          name: 'Near me'
        });
      },
      () => {
        // Permission denied or error - fall back to Adelaide
        resolve(LOCATION_CONFIGS['Adelaide']);
      },
      {
        timeout: 5000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}


