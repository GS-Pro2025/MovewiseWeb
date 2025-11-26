/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ProxyCountry {
  name: string;
  iso2?: string;
  iso3?: string;
  lat?: number;
  long?: number;
  [key: string]: any;
}

export interface ProxyState {
  name: string;
  state_code?: string;
  [key: string]: any;
}

export type ProxyCity = string | { name?: string; [key: string]: any };

export interface CountriesNowCountriesResponse {
  data: Array<{ name: string; iso2?: string; iso3?: string; [key: string]: any }>;
  error?: string;
  [key: string]: any;
}

export interface CountriesNowStatesResponse {
  data?: { states?: Array<{ name: string; state_code?: string; [key: string]: any }> };
  error?: string;
  [key: string]: any;
}

export interface CountriesNowCitiesResponse {
  data?: string[] | { cities?: string[] } | any;
  error?: string;
  [key: string]: any;
}