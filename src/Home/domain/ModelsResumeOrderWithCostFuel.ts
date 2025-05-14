export interface Person {
    email: string;
    first_name: string;
    last_name: string;
}

export interface Truck {
    id_truck: number;
    number_truck: string;
    type: string;
    name: string;
    status: boolean;
    category: string;
}

export interface FuelCost {
    id_fuel: number;
    cost_fuel: number;
    cost_gl: number;
    fuel_qty: number;
    distance: number;
    truck: Truck;
}

export interface Result {
    key: string;
    key_ref: string;
    date: string;
    distance: number | null;
    weight: string;
    status: string;
    evidence: string | null;
    dispatch_ticket: string;
    dispatch_ticket_url: string;
    state_usa: string;
    person: Person;
    job: number;
    customer_factory: number;
    fuelCost: FuelCost[];
}

export interface Data {
    count: number;
    next: string | null;
    previous: string | null;
    results: Result[];
}

export interface OrdersWithCostFuelResponse {
    status: string;
    messDev: string;
    messUser: string;
    current_company_id: number;
    data: Data;
}