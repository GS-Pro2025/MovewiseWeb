import React, { useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Definir la interfaz WeekAmounts que faltaba
interface WeekAmounts {
  Mon?: number;
  Tue?: number;
  Wed?: number;
  Thu?: number;
  Fri?: number;
  Sat?: number;
  Sun?: number;
}

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: (updatedOperator: any) => void;
  operatorData: {
    code: string;
    name: string;
    lastName: string; // Agregamos esta línea
    role: string;
    Mon?: number;
    Tue?: number;
    Wed?: number;
    Thu?: number;
    Fri?: number;
    Sat?: number;
    Sun?: number;
    total?: number;
    additionalBonuses?: number;
    grandTotal?: number;
  } | null;
}

const formatCurrency = (n: number | undefined) =>
  n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  operatorInfo: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#000',
    fontWeight: 'bold',
  },
});

// Componente PDF
// Agregar esta interfaz para los días
interface DayInfo {
  key: keyof WeekAmounts;
  label: string;
}

// Modificar el componente PayrollPDF con tipos apropiados
const PayrollPDF: React.FC<{
  operatorData: NonNullable<PayrollModalProps['operatorData']>;
  days: DayInfo[];
}> = ({ operatorData, days }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Payment Summary</Text>
      
      <View style={styles.operatorInfo}>
        <Text>Code: {operatorData.code}</Text>
        <Text>Name: {operatorData.name}</Text>
        <Text>Last Name: {operatorData.lastName}</Text>
        <Text>Role: {operatorData.role}</Text>
      </View>

      {days.map(({ key, label }) => (
        <View key={key} style={styles.row}>
          <Text>{label}</Text>
          <Text>
            {operatorData[key] 
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                  .format(operatorData[key] as number)
              : '—'}
          </Text>
        </View>
      ))}

      <View style={styles.total}>
        <Text>Subtotal</Text>
        <Text>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(operatorData.total || 0)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text>Additional Bonus</Text>
        <Text>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(operatorData.additionalBonuses || 0)}
        </Text>
      </View>

      <View style={styles.total}>
        <Text>Grand Total</Text>
        <Text>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(operatorData.grandTotal || 0)}
        </Text>
      </View>
    </Page>
  </Document>
);

export const PayrollModal: React.FC<PayrollModalProps> = ({ 
  isOpen, 
  onClose, 
  operatorData,
  onPaymentComplete 
}) => {
  if (!isOpen || !operatorData) return null;

  const days: { key: keyof WeekAmounts; label: string; }[] = [
    { key: 'Mon', label: 'Monday' },
    { key: 'Tue', label: 'Tuesday' },
    { key: 'Wed', label: 'Wednesday' },
    { key: 'Thu', label: 'Thursday' },
    { key: 'Fri', label: 'Friday' },
    { key: 'Sat', label: 'Saturday' },
    { key: 'Sun', label: 'Sunday' }
  ] as const;

  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [additionalBonus, setAdditionalBonus] = useState(operatorData?.additionalBonuses || 0);
  const [grandTotal, setGrandTotal] = useState(operatorData?.grandTotal || 0);

  // Función para manejar el cambio del bonus
  const handleBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setAdditionalBonus(value);
    setGrandTotal((operatorData?.total || 0) + value);
  };

  const handlePayment = () => {
    // Actualizar el estado de pago del operador
    if (operatorData) {
      const updatedOperator = { ...operatorData, pay: '✅' };
      onClose();
      // Llamar a la función de actualización del padre
      if (onPaymentComplete) {
        onPaymentComplete(updatedOperator);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-lg font-semibold">Code: {operatorData.code}</p>
          <p className="text-gray-600">Name: {operatorData.name}</p>
          <p className="text-gray-600">Last Name: {operatorData.lastName}</p>
          <p className="text-gray-500">Role: {operatorData.role}</p>
        </div>

        <div className="space-y-2">
          {days.map(({ key, label }) => (
            <div key={key} className="flex justify-between py-1 border-b">
              <span>{label}</span>
              <span>{formatCurrency(operatorData[key as keyof typeof operatorData] as number)}</span>
            </div>
          ))}
          
          <div className="flex justify-between pt-2">
            <span>Subtotal</span>
            <span>{formatCurrency(operatorData.total)}</span>
          </div>

          <div className="flex justify-between py-1 border-b items-center">
            <span>Additional Bonus</span>
            <div className="flex items-center">
              <span className="mr-2">$</span>
              <input
                type="number"
                value={additionalBonus}
                onChange={handleBonusChange}
                className="w-24 px-2 py-1 border rounded text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2 font-bold">
            <span>Grand Total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <PDFDownloadLink
            document={<PayrollPDF 
              operatorData={{
                ...operatorData,
                additionalBonuses: additionalBonus,
                grandTotal: grandTotal
              }} 
              days={days} 
            />}
            fileName={`payment-summary-${operatorData.code}-${getCurrentDate()}.pdf`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
          </PDFDownloadLink>
          
          <button
            onClick={handlePayment}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
};