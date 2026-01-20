/**
 * Location object with coordinates and address
 */
export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Route object with origin and destination
 */
export interface RouteData {
  origin: LocationData;
  destination: LocationData;
}

/**
 * Parse location from string or object format
 */
export function parseLocation(location: unknown): LocationData | null {
  if (!location) return null;

  try {
    // Si es string, intenta parsear como JSON
    if (typeof location === 'string') {
      // Convierte comillas simples a dobles para soportar Python dict
      const normalized = location.replace(/'/g, '"');
      const parsed = JSON.parse(normalized);
      
      return {
        latitude: Number(parsed.latitude),
        longitude: Number(parsed.longitude),
        address: parsed.address || `Lat: ${parsed.latitude}, Lng: ${parsed.longitude}`,
      };
    }

    // Si es objeto directo
    if (typeof location === 'object' && location !== null) {
      const loc = location as Record<string, unknown>;
      return {
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        address: String(loc.address || `Lat: ${loc.latitude}, Lng: ${loc.longitude}`),
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing location:', location, error);
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
    // Use 'place' mode so the embed shows a marker at the coordinates
    // q accepts latitude,longitude as a valid value
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=15`;
  } else {
    // URL for opening in new window
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}

/**
 * Generate Google Maps Directions URL for embedding a route between two points
 */
export function generateGoogleMapsDirectionsUrl(route: RouteData | null): string | null {
  if (!route) return null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const origin = `${route.origin.latitude},${route.origin.longitude}`;
  const destination = `${route.destination.latitude},${route.destination.longitude}`;

  // Use 'directions' mode to embed a route
  return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}&mode=driving`;
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

/**
 * Format route for display
 */
export function formatRouteDisplay(route: RouteData | null): string {
  if (!route) return 'N/A';
  return `${formatLocationDisplay(route.origin)} → ${formatLocationDisplay(route.destination)}`;
}
