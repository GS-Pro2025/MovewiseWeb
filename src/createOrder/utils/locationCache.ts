/* eslint-disable @typescript-eslint/no-explicit-any */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // tiempo de vida en minutos
}

class LocationCache {
  // TTL en minutos para diferentes tipos de datos
  private static readonly TTL = {
    COUNTRIES: 24 * 60,    // 24 horas - los países cambian muy poco
    STATES: 12 * 60,       // 12 horas - los estados cambian poco
    CITIES: 6 * 60,        // 6 horas - las ciudades pueden cambiar más
  };

  private static getCacheKey(type: 'countries' | 'states' | 'cities', ...params: string[]): string {
    return `location_${type}_${params.join('_').toLowerCase()}`;
  }

  private static setCookie(key: string, value: string, ttlMinutes: number): void {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + ttlMinutes * 60 * 1000);
      document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    } catch (error) {
      console.warn('Failed to set location cache cookie:', error);
    }
  }

  private static getCookie(key: string): string | null {
    try {
      const name = key + "=";
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to get location cache cookie:', error);
      return null;
    }
  }

  private static deleteCookie(key: string): void {
    try {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch (error) {
      console.warn('Failed to delete location cache cookie:', error);
    }
  }

  private static isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const expirationTime = entry.timestamp + (entry.ttl * 60 * 1000);
    return now > expirationTime;
  }

  static get<T>(type: 'countries' | 'states' | 'cities', ...params: string[]): T | null {
    const key = this.getCacheKey(type, ...params);
    const cookieValue = this.getCookie(key);
    
    if (!cookieValue) {
      return null;
    }

    try {
      const entry: CacheEntry<T> = JSON.parse(cookieValue);
      
      if (this.isExpired(entry)) {
        this.deleteCookie(key);
        return null;
      }
      
      console.log(`Cache HIT for ${type} (${params.join(', ')})`);
      return entry.data;
    } catch (error) {
      console.warn('Failed to parse cached location data:', error);
      this.deleteCookie(key);
      return null;
    }
  }

  static set<T>(type: 'countries' | 'states' | 'cities', data: T, ...params: string[]): void {
    const key = this.getCacheKey(type, ...params);
    const ttl = this.TTL[type.toUpperCase() as keyof typeof this.TTL];
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    try {
      const serialized = JSON.stringify(entry);
      
      // Verificar tamaño de cookie (máximo ~4KB)
      if (serialized.length > 3500) {
        console.warn(`Cache data too large for ${type}, skipping cache`);
        return;
      }
      
      this.setCookie(key, serialized, ttl);
      console.log(`Cache SET for ${type} (${params.join(', ')}) - TTL: ${ttl}min`);
    } catch (error) {
      console.warn('Failed to cache location data:', error);
    }
  }

  static clear(type?: 'countries' | 'states' | 'cities'): void {
    try {
      const cookies = document.cookie.split(';');
      const prefix = type ? `location_${type}_` : 'location_';
      
      cookies.forEach(cookie => {
        const [name] = cookie.split('=');
        if (name.trim().startsWith(prefix)) {
          this.deleteCookie(name.trim());
        }
      });
      
      console.log(`Cache cleared for ${type || 'all location data'}`);
    } catch (error) {
      console.warn('Failed to clear location cache:', error);
    }
  }

  // Método para obtener estadísticas de caché
  static getStats(): { total: number; countries: number; states: number; cities: number } {
    try {
      const cookies = document.cookie.split(';');
      const stats = { total: 0, countries: 0, states: 0, cities: 0 };
      
      cookies.forEach(cookie => {
        const [name] = cookie.split('=');
        const cleanName = name.trim();
        if (cleanName.startsWith('location_')) {
          stats.total++;
          if (cleanName.includes('_countries_')) stats.countries++;
          else if (cleanName.includes('_states_')) stats.states++;
          else if (cleanName.includes('_cities_')) stats.cities++;
        }
      });
      
      return stats;
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { total: 0, countries: 0, states: 0, cities: 0 };
    }
  }
}

export default LocationCache;