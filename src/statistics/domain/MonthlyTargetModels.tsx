export interface MonthlyPayrollData {
  totalGrossEarnings: number;    // Ganancias brutas (total + bonuses)
  totalExpenses: number;         // Gastos totales
  netEarnings: number;          // Ganancias netas (brutas - gastos)
  operatorsCount: number;       // Número de operadores
  workingDays: number;          // Días trabajados en el mes
}

export interface MonthlyTargetComparison {
  current: MonthlyPayrollData;
  previous: MonthlyPayrollData;
  netEarningsChange: number;     // % cambio en ganancias netas
  grossEarningsChange: number;   // % cambio en ganancias brutas
  expensesChange: number;        // % cambio en gastos
  targetPercent: number;         // % del target alcanzado
}