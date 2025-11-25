export interface Country {
  code: string;
  name: string;
}

export interface State {
  name: string;
  state_code: string;
}

export interface City {
  name: string;
}

export interface LocationFallbackResponse {
  status: string;
  data: Country[] | State[] | City[];
  message: string;
}

export class LocationFallback {
  private baseUrl: string = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

  async fetchCountries(): Promise<Country[]> {
    try {
      console.log('Attempting to fetch countries from fallback API...');
      
      const response = await fetch(`${this.baseUrl}/orders-locations-fallback/?type=countries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Fallback API error: ${response.status} - ${response.statusText}`);
      }
      
      const data: LocationFallbackResponse = await response.json();
      
      if (data.status === 'success') {
        console.log(`Fallback: Successfully fetched ${data.data.length} countries`);
        return data.data as Country[];
      }
      
      throw new Error(data.message || 'Fallback API returned error status');
    } catch (error) {
      console.error('LocationFallback: Failed to fetch countries:', error);
      throw error;
    }
  }

  async fetchStates(country: string): Promise<State[]> {
    try {
      console.log(`Attempting to fetch states for "${country}" from fallback API...`);
      
      const response = await fetch(`${this.baseUrl}/orders-locations-fallback/?type=states&country=${encodeURIComponent(country)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Fallback API error: ${response.status} - ${response.statusText}`);
      }
      
      const data: LocationFallbackResponse = await response.json();
      
      if (data.status === 'success') {
        console.log(`Fallback: Successfully fetched ${data.data.length} states for ${country}`);
        return data.data as State[];
      }
      
      throw new Error(data.message || 'Fallback API returned error status');
    } catch (error) {
      console.error(`LocationFallback: Failed to fetch states for ${country}:`, error);
      throw error;
    }
  }

  async fetchCities(country: string, state: string): Promise<string[]> {
    try {
      console.log(`Attempting to fetch cities for "${state}, ${country}" from fallback API...`);
      
      const response = await fetch(`${this.baseUrl}/orders-locations-fallback/?type=cities&country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Fallback API error: ${response.status} - ${response.statusText}`);
      }
      
      const data: LocationFallbackResponse = await response.json();
      
      if (data.status === 'success') {
        console.log(`Fallback: Successfully fetched ${data.data.length} cities for ${state}, ${country}`);
        // Convertir objetos City a strings
        return (data.data as City[]).map(city => city.name);
      }
      
      throw new Error(data.message || 'Fallback API returned error status');
    } catch (error) {
      console.error(`LocationFallback: Failed to fetch cities for ${state}, ${country}:`, error);
      throw error;
    }
  }
}

// Instancia singleton para usar en el repositorio
export const locationFallback = new LocationFallback();