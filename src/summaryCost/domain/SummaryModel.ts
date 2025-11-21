export interface Summary {
    expense: number;
    rentingCost: number;
    fuelCost: number;
    workCost: number;
    driverSalaries: number;
    otherSalaries: number;
    totalCost: number;
    customer_factory?: number;
    operators_discount?: number;
    bonus?: number;
}