import { CitiesResponse, CountriesResponse, Country, State, StatesResponse } from "../models/LocationModels";
import { locationFallback } from "../../service/Location/LocationFallback";

// Fetcher para países con fallback
export async function fetchCountries(): Promise<Country[]> {
  try {
    console.log('Attempting to fetch countries from primary source (countriesnow.space)...');
    
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
    
    if (!res.ok) {
      throw new Error(`Primary API error: ${res.status} - ${res.statusText}`);
    }
    
    const data: CountriesResponse = await res.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('Primary API returned empty data');
    }
    
    console.log(`Primary: Successfully fetched ${data.data.length} countries`);
    return data.data;
    
  } catch (primaryError) {
    console.warn('Primary countries source failed:', primaryError);
    
    try {
      console.log('Switching to fallback countries source...');
      
      const fallbackCountries = await locationFallback.fetchCountries();
      
      // Adaptar formato del fallback al formato esperado
      return fallbackCountries.map(country => ({
        name: country.name,
        iso2: country.code,
        iso3: country.code,
        lat: 0, // El fallback no incluye coordenadas
        long: 0
      }));
      
    } catch (fallbackError) {
      console.error('Fallback countries source also failed:', fallbackError);
      throw new Error('All location services failed for countries. Please try again later.');
    }
  }
}

// Fetcher para estados de un país con fallback
export async function fetchStates(country: string): Promise<State[]> {
  try {
    console.log(`Attempting to fetch states for "${country}" from primary source...`);
    
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country }),
    });
    
    if (!res.ok) {
      throw new Error(`Primary API error: ${res.status} - ${res.statusText}`);
    }
    
    const data: StatesResponse = await res.json();
    
    if (!data.data || !data.data.states || data.data.states.length === 0) {
      throw new Error('Primary API returned empty states data');
    }
    
    console.log(`Primary: Successfully fetched ${data.data.states.length} states for ${country}`);
    return data.data.states;
    
  } catch (primaryError) {
    console.warn(`Primary states source failed for "${country}":`, primaryError);
    
    try {
      console.log(`Switching to fallback states source for "${country}"...`);
      
      const fallbackStates = await locationFallback.fetchStates(country);
      
      // Adaptar formato del fallback al formato esperado
      return fallbackStates.map(state => ({
        name: state.name,
        state_code: state.state_code
      }));
      
    } catch (fallbackError) {
      console.error(`Fallback states source also failed for "${country}":`, fallbackError);
      throw new Error(`All location services failed for states of "${country}". Please try again later.`);
    }
  }
}

// Fetcher para ciudades de un estado con fallback
export async function fetchCities(country: string, state: string): Promise<string[]> {
  try {
    console.log(`Attempting to fetch cities for "${state}, ${country}" from primary source...`);
    
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, state }),
    });
    
    if (!res.ok) {
      throw new Error(`Primary API error: ${res.status} - ${res.statusText}`);
    }
    
    const data: CitiesResponse = await res.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('Primary API returned empty cities data');
    }
    
    console.log(`Primary: Successfully fetched ${data.data.length} cities for ${state}, ${country}`);
    return data.data;
    
  } catch (primaryError) {
    console.warn(`Primary cities source failed for "${state}, ${country}":`, primaryError);
    
    try {
      console.log(`Switching to fallback cities source for "${state}, ${country}"...`);
      
      const fallbackCities = await locationFallback.fetchCities(country, state);
      
      console.log(`Fallback: Successfully fetched ${fallbackCities.length} cities for ${state}, ${country}`);
      return fallbackCities;
      
    } catch (fallbackError) {
      console.error(`Fallback cities source also failed for "${state}, ${country}":`, fallbackError);
      
      // Para ciudades, retornar array vacío en lugar de error
      console.log('Returning empty cities array as graceful degradation');
      return [];
    }
  }
}