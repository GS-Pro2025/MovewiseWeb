/* eslint-disable @typescript-eslint/no-explicit-any */
import { CitiesResponse, CountriesResponse, Country, State, StatesResponse } from "../models/LocationModels";
import { locationFallback } from "../../service/Location/LocationFallback";
import { ProxyCountry, ProxyState } from "../types/LocationAPI";
import LocationCache from "../utils/locationCache";

function normalizeString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function ensureArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/* Caches */
let proxyCountriesCache: ProxyCountry[] | null = null;
const proxyStatesCacheByCountryIso: Record<string, ProxyState[] | null> = {};

// Base para proxys (usar la URL del backend; sin auth)
const PROXY_BASE = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

/* Typed proxy helpers */
async function fetchProxyCountries(): Promise<ProxyCountry[]> {
  if (proxyCountriesCache) return proxyCountriesCache;
  const url = PROXY_BASE ? `${PROXY_BASE}/orders-locations-csc/countries/` : `/orders-locations-csc/countries/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Proxy countries error ${res.status}`);
  const json = await res.json().catch(() => ({}));
  const list = Array.isArray(json) ? json : (json.data || json.results || []);
  const arr = ensureArray<any>(list).map((c: any) => ({
    name: normalizeString(c.name || c.country || c.country_name),
    iso2: normalizeString(c.iso2 || c.code || c.country_iso),
    iso3: normalizeString(c.iso3 || c.iso),
    lat: typeof c.lat === "number" ? c.lat : undefined,
    long: typeof c.long === "number" ? c.long : undefined,
    raw: c
  })).filter(c => c.name);
  if (arr.length === 0) throw new Error("Proxy returned empty countries");
  proxyCountriesCache = arr;
  return arr;
}

async function fetchProxyStates(countryIso: string): Promise<ProxyState[]> {
  if (!countryIso) throw new Error("Missing country ISO for proxy states");
  if (proxyStatesCacheByCountryIso[countryIso]) return proxyStatesCacheByCountryIso[countryIso] as ProxyState[];
  const url = PROXY_BASE ? `${PROXY_BASE}/orders-locations-csc/countries/${encodeURIComponent(countryIso)}/states/`
                         : `/orders-locations-csc/countries/${encodeURIComponent(countryIso)}/states/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Proxy states error ${res.status}`);
  const json = await res.json().catch(() => ({}));
  const list = Array.isArray(json) ? json : (json.data || json.results || []);
  const arr = ensureArray<any>(list).map((s: any) => ({
    name: normalizeString(s.name || s.state || s.state_name),
    state_code: normalizeString(s.state_code || s.code || s.iso),
    raw: s
  })).filter(s => s.name);
  if (arr.length === 0) throw new Error("Proxy returned empty states");
  proxyStatesCacheByCountryIso[countryIso] = arr;
  return arr;
}

async function fetchProxyCities(countryIso: string, stateIso: string): Promise<string[]> {
  if (!countryIso || !stateIso) throw new Error("Missing ISO params for proxy cities");
  const url = PROXY_BASE ? `${PROXY_BASE}/orders-locations-csc/countries/${encodeURIComponent(countryIso)}/states/${encodeURIComponent(stateIso)}/cities/`
                         : `/orders-locations-csc/countries/${encodeURIComponent(countryIso)}/states/${encodeURIComponent(stateIso)}/cities/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Proxy cities error ${res.status}`);
  const json = await res.json().catch(() => ({}));
  const list = Array.isArray(json) ? json : (json.data || json.results || []);
  const arr = ensureArray<any>(list).map((c: any) => (typeof c === "string" ? c : normalizeString(c.name || c.city))).filter(Boolean);
  if (arr.length === 0) throw new Error("Proxy returned empty cities");
  return arr;
}

// Fetcher para países con nuevo orden de fallback (proxy -> countriesnow -> local fallback)
export async function fetchCountries(): Promise<Country[]> {
  // 1) Check cache first
  const cachedCountries = LocationCache.get<Country[]>('countries');
  if (cachedCountries) {
    return cachedCountries;
  }

  // 2) Try proxy
  try {
    console.log("Trying to fetch proxy countries")
    const proxy = await fetchProxyCountries();
    console.log(`Proxy: Successfully fetched ${proxy.length} countries`);
    LocationCache.set('countries', proxy);
    return proxy;
  } catch (proxyErr) {
    console.warn("Proxy countries failed, falling back to countriesnow.space...", proxyErr);
  }

  // 3) Try countriesnow.space (existing primary previously)
  try {
    console.log('Attempting to fetch countries from countriesnow.space...');
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
    if (!res.ok) throw new Error(`countriesnow error ${res.status}`);
    const data: CountriesResponse = await res.json();
    if (!data.data || data.data.length === 0) throw new Error('countriesnow returned empty data');
    console.log(`countriesnow: Successfully fetched ${data.data.length} countries`);
    LocationCache.set('countries', data.data);
    return data.data;
  } catch (secondErr) {
    console.warn('countriesnow failed, trying fallback source...', secondErr);
  }

  // 4) Last resort: local fallback
  try {
    const fallbackCountries = await locationFallback.fetchCountries();
    const mappedCountries = fallbackCountries.map(country => ({
      name: country.name,
      iso2: country.code,
      iso3: country.code,
      lat: 0,
      long: 0
    }));
    LocationCache.set('countries', mappedCountries);
    return mappedCountries;
  } catch (fallbackError) {
    console.error('All location services failed for countries:', fallbackError);
    throw new Error('All location services failed for countries. Please try again later.');
  }
}

// Fetcher para estados con nuevo orden (proxy -> countriesnow -> fallback)
export async function fetchStates(country: string): Promise<State[]> {
  // 1) Check cache first
  const cachedStates = LocationCache.get<State[]>('states', country);
  if (cachedStates) {
    return cachedStates;
  }

  // Try to resolve country ISO using proxy countries (if available) or fallback to external
  let countryIso: string | null = null;

  // attempt proxy countries lookup
  try {
    const proxyCountries = await fetchProxyCountries();
    const found = proxyCountries.find(c => c.name.toLowerCase() === country.toLowerCase() || (c.iso2 && c.iso2.toLowerCase() === country.toLowerCase()));
    if (found && found.iso2) countryIso = found.iso2;
  } catch {
    // ignore - proxy may be down
    countryIso = null;
  }

  // 2) If we have countryIso, try proxy states
  if (countryIso) {
    try {
      const proxyStates = await fetchProxyStates(countryIso);
      console.log(`Proxy: Successfully fetched ${proxyStates.length} states for ${country} (${countryIso})`);
      LocationCache.set('states', proxyStates, country);
      return proxyStates;
    } catch (proxyStatesErr) {
      console.warn(`Proxy states failed for ${countryIso}, continuing to countriesnow...`, proxyStatesErr);
    }
  }

  // 3) Try countriesnow.space POST as before (uses country name)
  try {
    console.log(`Attempting to fetch states for "${country}" from countriesnow.space...`);
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country }),
    });
    if (!res.ok) throw new Error(`countriesnow states error ${res.status}`);
    const data: StatesResponse = await res.json();
    if (!data.data || !data.data.states || data.data.states.length === 0) throw new Error('countriesnow returned empty states');
    console.log(`countriesnow: Successfully fetched ${data.data.states.length} states for ${country}`);
    LocationCache.set('states', data.data.states, country);
    return data.data.states;
  } catch (secondErr) {
    console.warn(`countriesnow states failed for "${country}", trying fallback...`, secondErr);
  }

  // 4) Fallback
  try {
    const fallbackStates = await locationFallback.fetchStates(country);
    const mappedStates = fallbackStates.map(state => ({
      name: state.name,
      state_code: state.state_code
    }));
    LocationCache.set('states', mappedStates, country);
    return mappedStates;
  } catch (fallbackError) {
    console.error(`All location services failed for states of "${country}".`, fallbackError);
    throw new Error(`All location services failed for states of "${country}". Please try again later.`);
  }
}

// Fetcher para ciudades con nuevo orden (proxy -> countriesnow -> fallback; fallback returns [] gracefully)
export async function fetchCities(country: string, state: string): Promise<string[]> {
  // 1) Check cache first
  const cachedCities = LocationCache.get<string[]>('cities', country, state);
  if (cachedCities) {
    return cachedCities;
  }

  // Resolve country ISO and state ISO for proxy attempt
  let countryIso: string | null = null;
  let stateIso: string | null = null;

  // Try to get proxy countries and states to map names -> ISO codes
  try {
    const proxyCountries = await fetchProxyCountries();
    const foundCountry = proxyCountries.find(c => c.name.toLowerCase() === country.toLowerCase() || (c.iso2 && c.iso2.toLowerCase() === country.toLowerCase()));
    if (foundCountry) {
      const iso = foundCountry.iso2;
      if (iso) {
        countryIso = iso;
        // try fetch states for that country via proxy and map state name -> state_code
        try {
          const proxyStates = await fetchProxyStates(iso);
          const foundState = proxyStates.find(s => s.name.toLowerCase() === state.toLowerCase() || (s.state_code && s.state_code.toLowerCase() === state.toLowerCase()));
          if (foundState && foundState.state_code) stateIso = foundState.state_code;
        } catch {
          // ignore states lookup failure
          stateIso = null;
        }
      }
    }
  } catch {
    // ignore proxy countries failure
    countryIso = null;
    stateIso = null;
  }

  // 2) If we have both ISO codes, try proxy cities
  if (countryIso && stateIso) {
    try {
      const proxyCities = await fetchProxyCities(countryIso, stateIso);
      console.log(`Proxy: Successfully fetched ${proxyCities.length} cities for ${state}, ${country}`);
      LocationCache.set('cities', proxyCities, country, state);
      return proxyCities;
    } catch (proxyErr) {
      console.warn(`Proxy cities failed for ${countryIso}/${stateIso}, continuing to countriesnow...`, proxyErr);
    }
  }

  // 3) Try countriesnow.space POST as before (uses country + state)
  try {
    console.log(`Attempting to fetch cities for "${state}, ${country}" from countriesnow.space...`);
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, state }),
    });
    if (!res.ok) throw new Error(`countriesnow cities error ${res.status}`);
    const data: CitiesResponse = await res.json();
    // data.data may be an array of strings or nested; try to normalize
    let list: string[] = [];
    if (Array.isArray((data as any).data)) {
      list = (data as any).data as string[];
    } else if (Array.isArray((data as any).data?.data)) {
      list = (data as any).data.data;
    } else if (Array.isArray((data as any).data?.cities)) {
      list = (data as any).data.cities;
    }
    if (!Array.isArray(list) || list.length === 0) throw new Error('countriesnow returned empty cities');
    console.log(`countriesnow: Successfully fetched ${list.length} cities for ${state}, ${country}`);
    const filteredList = list.filter(Boolean);
    LocationCache.set('cities', filteredList, country, state);
    return filteredList;
  } catch (secondErr) {
    console.warn(`countriesnow cities failed for "${state}, ${country}", trying fallback...`, secondErr);
  }

  // 4) Fallback (should return [] gracefully)
  try {
    const fallbackCities = await locationFallback.fetchCities(country, state);
    const cities = Array.isArray(fallbackCities) ? fallbackCities : [];
    LocationCache.set('cities', cities, country, state);
    return cities;
  } catch (fallbackErr) {
    console.error(`All location services failed for cities of "${state}, ${country}".`, fallbackErr);
    const emptyList: string[] = [];
    LocationCache.set('cities', emptyList, country, state);
    return emptyList;
  }
}

// Función utilitaria para limpiar caché manualmente
export function clearLocationCache(type?: 'countries' | 'states' | 'cities'): void {
  LocationCache.clear(type);
}

// Función para obtener estadísticas de caché
export function getLocationCacheStats() {
  return LocationCache.getStats();
}