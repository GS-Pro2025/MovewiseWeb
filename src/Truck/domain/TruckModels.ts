
  export interface TruckResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Truck[];
  }


export interface TruckFormData {
  number_truck: string;
  type: string;       
  name: string;
  category: string;
}

export interface Truck {
  id_truck: number;
  number_truck: string;
  type: string;        
  name: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}