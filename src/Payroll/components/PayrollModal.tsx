import React, { useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { createPayment } from '../../service/PayrollService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Definir la interfaz WeekAmounts
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
    lastName: string;
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
    assignmentIds?: (number | string)[];
    paymentIds?: (number | string)[];
  };
  periodStart: string;
  periodEnd: string;
}

const formatCurrency = (n?: number) =>
  typeof n === 'number' && !isNaN(n)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    : '—';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#ffffff', padding: 30 },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  operatorInfo: { marginBottom: 20 },
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

interface DayInfo { key: keyof WeekAmounts; label: string; }

const PayrollPDF: React.FC<{ operatorData: NonNullable<PayrollModalProps['operatorData']>; days: DayInfo[]; periodStart: string; periodEnd: string }> = ({ operatorData, days, periodStart, periodEnd }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Payment Summary</Text>
      <View style={styles.operatorInfo}>
        <Text>Code: {operatorData.code}</Text>
        <Text>Name: {operatorData.name}</Text>
        <Text>Last Name: {operatorData.lastName}</Text>
        <Text>Role: {operatorData.role}</Text>
        <Text>Period: {periodStart} → {periodEnd}</Text>
      </View>
      {days.map(({ key, label }) => (
        <View key={key} style={styles.row}>
          <Text>{label}</Text>
          <Text>{formatCurrency(operatorData[key])}</Text>
        </View>
      ))}
      <View style={styles.total}>
        <Text>Subtotal</Text>
        <Text>{formatCurrency(operatorData.total)}</Text>
      </View>
      <View style={styles.row}>
        <Text>Additional Bonus</Text>
        <Text>{formatCurrency(operatorData.additionalBonuses)}</Text>
      </View>
      <View style={styles.total}>
        <Text>Grand Total</Text>
        <Text>{formatCurrency(operatorData.grandTotal)}</Text>
      </View>
    </Page>
  </Document>
);

export const PayrollModal: React.FC<PayrollModalProps> = ({
  isOpen,
  onClose,
  operatorData,
  onPaymentComplete,
  periodStart,
  periodEnd,
}) => {
  // MOVIDOS AL INICIO: Todos los hooks useState deben estar ANTES de cualquier return condicional
  const [additionalBonus, setAdditionalBonus] = useState(operatorData.additionalBonuses || 0);
  const [grandTotal, setGrandTotal] = useState(operatorData.grandTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(!!operatorData.paymentIds?.length);

  // AHORA SÍ puede ir el return condicional
  if (!isOpen) return null;

  const days: DayInfo[] = [
    { key: 'Mon', label: 'Monday' },
    { key: 'Tue', label: 'Tuesday' },
    { key: 'Wed', label: 'Wednesday' },
    { key: 'Thu', label: 'Thursday' },
    { key: 'Fri', label: 'Friday' },
    { key: 'Sat', label: 'Saturday' },
    { key: 'Sun', label: 'Sunday' },
  ];

  const getCurrentDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setAdditionalBonus(value);
    setGrandTotal((operatorData.total || 0) + value);
  };

  const handlePayment = async () => {
    if (!operatorData.assignmentIds) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        id_assigns: operatorData.assignmentIds as number[],
        value: grandTotal,
        bonus: additionalBonus,
        status: 'paid',
        date_start: periodStart,
        date_end: periodEnd,
      };
      await createPayment(payload);
      setIsPaid(true);
      toast.success('Payment saved!');
      if (onPaymentComplete) onPaymentComplete({ ...operatorData, pay: '✅' });
    } catch (e: any) {
      setError(e.message || 'Payment failed');
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Payment Summary</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <div className="mb-4">
            <p className="text-lg font-semibold">Code: {operatorData.code}</p>
            <p className="text-gray-600">Name: {operatorData.name}</p>
            <p className="text-gray-600">Last Name: {operatorData.lastName}</p>
            <p className="text-gray-500">Role: {operatorData.role}</p>
            <p className="text-gray-500">Period: {periodStart} → {periodEnd}</p>
          </div>
          <div className="space-y-2">
            {days.map(({ key, label }) => (
              <div key={key} className="flex justify-between py-1 border-b">
                <span>{label}</span>
                <span>{formatCurrency(operatorData[key])}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <span>Subtotal</span>
              <span>{formatCurrency(operatorData.total)}</span>
            </div>
            <div className="flex justify-between py-1 border-b items-center">
              <span>Additional Bonus</span>
              <input
                type="number"
                value={additionalBonus}
                onChange={handleBonusChange}
                min="0"
                step="0.01"
                disabled={loading || isPaid}
                className="w-24 px-2 py-1 border rounded text-right disabled:opacity-50"
              />
            </div>
            <div className="flex justify-between pt-2 font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            {isPaid ? (
              <PDFDownloadLink
                document={<PayrollPDF operatorData={{ ...operatorData, additionalBonuses: additionalBonus, grandTotal }} days={days} periodStart={periodStart} periodEnd={periodEnd} />}
                fileName={`payment-summary-${operatorData.code}-${getCurrentDate()}.pdf`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >{({ loading: pdfLoading }) => (pdfLoading ? 'Generating PDF...' : 'Download PDF')}</PDFDownloadLink>
            ) : (
              <button disabled className="px-4 py-2 bg-gray-400 text-white rounded">Download PDF</button>
            )}
            <button
              onClick={handlePayment}
              disabled={loading || isPaid}
              className={`px-4 py-2 ${loading || isPaid ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded`}
            >{isPaid ? 'Paid' : loading ? 'Processing...' : 'Pay'}</button>
          </div>
        </div>
      </div>
    </>
  );
};