export interface Truck {
  id_truck: number;
  number_truck: string;
  type: string;
  name: string;
  status: boolean;
  category: string;
}

export interface TrucksDataResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: Truck[];
}

export interface TrucksAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TrucksDataResponse;
}