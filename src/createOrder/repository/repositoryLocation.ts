import { CitiesResponse, CountriesResponse, Country, State, StatesResponse } from "../models/LocationModels";

// Fetcher para países
export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
  const data: CountriesResponse = await res.json();
  return data.data;
}

// Fetcher para estados de un país
export async function fetchStates(country: string): Promise<State[]> {
  const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country }),
  });
  const data: StatesResponse = await res.json();
  return data.data.states;
}

// Fetcher para ciudades de un estado
export async function fetchCities(country: string, state: string): Promise<string[]> {
  const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, state }),
  });
  const data: CitiesResponse = await res.json();
  return data.data;
}