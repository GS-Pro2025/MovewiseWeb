export interface FuelCostItem {
    id_order_cost_fuel: number;
    id_fuel: number;
    truck: string;
    cost_fuel_total: number;
    cost_fuel_distributed: number;
    fuel_qty_distributed: number;
    distance_distributed: number;
    date: string;
}

export interface WorkCostItem {
    id_workCost: number;
    name: string;
    cost: number;
    type: string;
}

export interface Summary {
    expense: number;
    rentingCost: number;
    fuelCost: number;
    fuel_costs?: FuelCostItem[];
    workCost: number;
    work_costs?: WorkCostItem[];
    driverSalaries: number;
    otherSalaries: number;
    customer_factory?: number;
    bonus?: number;
    totalCostFromTable?: number;
    costs?: unknown[];
    totalCost: number;
    net_profit?: number;
}