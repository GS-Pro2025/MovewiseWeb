import { OperatorRow } from '../../models/payrroll';

// Extender OperatorRow con campos adicionales necesarios
export interface OperatorRowExtended extends OperatorRow {
  netTotal: number;
  _bonusDaysAdded?: Set<string>;
}

// Type guard para verificar si es OperatorRowExtended
export function isOperatorRowExtended(row: OperatorRow): row is OperatorRowExtended {
  return 'netTotal' in row;
}