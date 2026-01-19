/**
 * Location object with coordinates and address
 */
export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Parse location from string or object format
 */
export function parseLocation(location: unknown): LocationData | null {
  if (!location) return null;

  try {
    // If it's a string, try to parse as JSON
    if (typeof location === 'string') {
      const parsed = JSON.parse(location);
      return {
        latitude: Number(parsed.latitude),
        longitude: Number(parsed.longitude),
        address: parsed.address || `Lat: ${parsed.latitude}, Lng: ${parsed.longitude}`,
      };
    }

    // If it's an object
    if (typeof location === 'object' && location !== null) {
      const loc = location as Record<string, unknown>;
      return {
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        address: String(loc.address || `Lat: ${loc.latitude}, Lng: ${loc.longitude}`),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a string looks like a JSON object (starts with {)
 */
export function isJsonLocation(location: unknown): boolean {
  if (typeof location === 'string') {
    const trimmed = location.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
  }
  return typeof location === 'object' && location !== null;
}

/**
 * Generate Google Maps URL for embedding or opening
 */
export function generateGoogleMapsUrl(location: LocationData | null, type: 'embed' | 'open' = 'embed'): string | null {
  if (!location) return null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { latitude, longitude } = location;

  if (type === 'embed') {
    // URL for embedding in iframe using view mode with center (required) and zoom
    return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${latitude},${longitude}&zoom=15`;
  } else {
    // URL for opening in new window
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}

/**
 * Generate static map image URL (optional, for thumbnails)
 */
export function generateStaticMapUrl(location: LocationData | null, width: number = 400, height: number = 300): string | null {
  if (!location) return null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { latitude, longitude } = location;

  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&key=${apiKey}`;
}

/**
 * Format location for display
 */
export function formatLocationDisplay(location: LocationData | null): string {
  if (!location) return 'N/A';
  return location.address || `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`;
}
