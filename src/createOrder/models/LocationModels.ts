// Interfaces para la API de CountriesNow

export interface Country {
  name: string;
  iso2?: string;
  iso3?: string;
}

export interface State {
  name: string;
}

export interface City {
  name: string;
}

// Respuesta para lista de países
export interface CountriesResponse {
  error: boolean;
  msg: string;
  data: Country[];
}

// Respuesta para lista de estados
export interface StatesResponse {
  error: boolean;
  msg: string;
  data: {
    name: string;
    states: State[];
  };
}

// Respuesta para lista de ciudades
export interface CitiesResponse {
  error: boolean;
  msg: string;
  data: string[];
}
