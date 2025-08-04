export interface OrderWithClient {
  key: string;
  key_ref: string;
  client_name: string;
  date: string;
  status: string;
  state_usa: string | null;
  customer_factory: string | null;
}

export interface WeekInfo {
  week: number;
  year: number;
  start_date: string;
  end_date: string;
}

export interface OrdersWithClientResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: OrderWithClient[];
  week_info: WeekInfo;
  total_orders: number;
  current_company_id: number;
}

export interface ClientStats {
  clientName: string;
  totalOrders: number;
  factoriesServed: string[]; 
  uniqueFactories: number;   
}

export interface FactoryStats {
  factoryName: string;
  totalOrders: number;
  clientsServed: string[];   
  uniqueClients: number;     
}

export interface WeeklyClientStats {
  totalClients: number;
  activeClients: number;
  totalFactories: number;
  activeFactories: number;
  topClients: ClientStats[];
  topFactories: FactoryStats[];
  totalOrders: number;
  averageOrdersPerClient: number;
  averageOrdersPerFactory: number;
}

export interface ClientStatsComparison {
  currentStats: WeeklyClientStats;
  previousStats: WeeklyClientStats;
  changes: {
    totalClientsChange: number;
    activeClientsChange: number;
    totalFactoriesChange: number;
    totalOrdersChange: number;
  };
}