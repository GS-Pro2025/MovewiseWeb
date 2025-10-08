export interface createCost{
    description: string;
    cost: number;
    type: string;
}

export interface Cost{
    id_cost: string,
    description: string,
    cost: number,
    type: string,
    date: string,
    update: string,
    is_active: boolean
}