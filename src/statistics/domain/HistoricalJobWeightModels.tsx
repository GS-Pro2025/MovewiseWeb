export interface WeightRange {
  min: number;
  max: number;
}

export interface HistoricalJobWeightRequest {
  ranges: WeightRange[];
}

export interface HistoricalJobWeightData {
  weight_range: string;
  job: string | null;
  average_income: number;
  orders_count: number;
}

export interface HistoricalJobWeightResponse {
  total_orders: number;
  data: HistoricalJobWeightData[];
}

export interface ProcessedHistoricalData {
  weightRange: string;
  jobs: {
    jobName: string;
    averageIncome: number;
    ordersCount: number;
    percentage: number;
  }[];
  totalOrdersInRange: number;
  rangePercentage: number;
}