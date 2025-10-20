/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { cancelPayments, createPayment } from '../../service/PayrollService';
import { updateAssign } from '../../service/AssignService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { pdf } from '@react-pdf/renderer';
import { PayrollEmailPDF } from './PayrollEmailPDF';
import { sendPdfEmail } from '../../service/EmailRepository';
import { sendPdfToWhatsapp } from '../../service/MetaApiService'; // NUEVO IMPORT

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
    email: string;
    phone?: string;
    code: string;
    name: string;
    lastName: string;
    role: string;
    cost: number;
    Mon?: number;
    Tue?: number;
    Wed?: number;
    Thu?: number;
    Fri?: number;
    Sat?: number;
    Sun?: number;
    total?: number;
    additionalBonuses: number; // CAMBIAR: requerir como number, no opcional
    grandTotal?: number;
    assignmentIds: (number | string)[]; // CAMBIAR: requerir como array, no opcional
    paymentIds: (number | string)[]; // CAMBIAR: requerir como array, no opcional
    expense?: number;
    assignmentIdsByDay?: { [key in keyof WeekAmounts]?: (number | string)[] };
  };
  periodStart: string;
  periodEnd: string;
  weekDates: { [key: string]: string };
  assignmentsByDay?: { [key in keyof WeekAmounts]?: { id: number | string; date: string; bonus?: number }[] };
}

const formatCurrency = (n?: number) =>
  typeof n === 'number' && !isNaN(n)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    : '$0.00';

// Estilos mejorados para el PDF
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 28,
    marginBottom: 30,
    textAlign: 'center',
    color: '#2563eb',
    fontWeight: 'bold',
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    paddingBottom: 15,
  },
  companyInfo: {
    marginBottom: 25,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
  },
  operatorInfo: {
    marginBottom: 25,
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    width: 80,
  },
  infoValue: {
    fontSize: 12,
    color: '#111827',
    flex: 1,
  },
  tableHeader: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    padding: 10,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  rowEven: {
    backgroundColor: '#f9fafb',
  },
  dayLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 'bold',
  },
  dayAmount: {
    fontSize: 12,
    color: '#111827',
    fontWeight: 'normal',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#ddd6fe',
    borderRadius: 4,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    marginTop: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  subtotalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  bonusLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
  bonusAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
  },
});

interface DayInfo { key: keyof WeekAmounts; label: string; }

const PayrollPDF: React.FC<{ 
  operatorData: NonNullable<PayrollModalProps['operatorData']>; 
  days: DayInfo[]; 
  periodStart: string; 
  periodEnd: string;
  dailyBonuses: WeekAmounts;
  totalDailyBonuses: number;
}> = ({ operatorData, days, periodStart, periodEnd, dailyBonuses, totalDailyBonuses }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>PAYMENT SUMMARY</Text>
      
      <View style={pdfStyles.companyInfo}>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Date:</Text>
          <Text style={pdfStyles.infoValue}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Period:</Text>
          <Text style={pdfStyles.infoValue}>{periodStart} → {periodEnd}</Text>
        </View>
      </View>

      <View style={pdfStyles.operatorInfo}>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Code:</Text>
          <Text style={pdfStyles.infoValue}>{operatorData.code}</Text>
        </View>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Name:</Text>
          <Text style={pdfStyles.infoValue}>{operatorData.name} {operatorData.lastName}</Text>
        </View>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Role:</Text>
          <Text style={pdfStyles.infoValue}>{operatorData.role}</Text>
        </View>
      </View>

      <View style={pdfStyles.tableHeader}>
        <Text style={pdfStyles.tableHeaderText}>DAILY BREAKDOWN</Text>
      </View>

      {days.map(({ key, label }, index) => {
        const baseAmount = operatorData[key] || 0;
        const bonusAmount = dailyBonuses[key] || 0;
        const totalAmount = baseAmount + bonusAmount;
        
        return (
          <View key={key} style={[pdfStyles.row, index % 2 === 0 ? pdfStyles.rowEven : {}]}>
            <View style={{ flex: 1 }}>
              <Text style={pdfStyles.dayLabel}>{label}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>
                Base: {formatCurrency(baseAmount)} + Bonus: {formatCurrency(bonusAmount)}
              </Text>
            </View>
            <Text style={pdfStyles.dayAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
        );
      })}

      <View style={pdfStyles.subtotalRow}>
        <Text style={pdfStyles.subtotalLabel}>Base Subtotal</Text>
        <Text style={pdfStyles.subtotalAmount}>{formatCurrency(operatorData.total)}</Text>
      </View>

      <View style={pdfStyles.bonusRow}>
        <Text style={pdfStyles.bonusLabel}>Daily Bonuses Total</Text>
        <Text style={pdfStyles.bonusAmount}>{formatCurrency(totalDailyBonuses)}</Text>
      </View>

      <View style={pdfStyles.totalRow}>
        <Text style={pdfStyles.totalLabel}>GRAND TOTAL</Text>
        <Text style={pdfStyles.totalAmount}>{formatCurrency(operatorData.grandTotal)}</Text>
      </View>

      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>
          This document was generated automatically on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </Page>
  </Document>
);

export const PayrollModal: React.FC<PayrollModalProps> = ({
  onClose,
  operatorData,
  onPaymentComplete,
  periodStart,
  periodEnd,
  weekDates,
  assignmentsByDay,
}) => {
  const [grandTotal, setGrandTotal] = useState(operatorData.grandTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(!!operatorData.paymentIds?.length);
  const [cancelLoading, setCancelLoading] = useState(false);
  // SIMPLIFICAR: Usar directamente el expense que viene del operador
  const [expense, setExpense] = useState<number>(operatorData.expense || 0);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false); // STATE
  const [whatsappNumber, setWhatsappNumber] = useState('+573126157025'); // STATE para número
  operatorData.phone = whatsappNumber;
  // Función para cancelar el pago
  const handleCancelPayment = async () => {
    if (!operatorData.assignmentIds || operatorData.assignmentIds.length === 0) return;
    setCancelLoading(true);
    try {
      await cancelPayments(operatorData.assignmentIds.map(Number));
      toast.success('Payment cancelled successfully! 🎉');
      setIsPaid(false);
      if (onPaymentComplete) onPaymentComplete({ ...operatorData, pay: null });
    } catch (e: any) {
      toast.error(e.message || 'Error cancelling payment');
    } finally {
      setCancelLoading(false);
    }
  };
  // Inicializa dailyBonuses con el bonus de la primera asignación de cada día (si existe)
  const [dailyBonuses, setDailyBonuses] = useState<WeekAmounts>(() => {
    const initial: WeekAmounts = {};
    const days: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(day => {
      // Busca el bonus en la primera asignación del día, si existe
      const assign = assignmentsByDay?.[day]?.[0];
      initial[day] = assign && typeof assign.bonus === 'number'
        ? assign.bonus
        : 0;
    });
    return initial;
  });
  const [savingBonus, setSavingBonus] = useState<{ [key in keyof WeekAmounts]?: boolean }>({});

  // REMOVER: Ya no necesitamos este useEffect para cargar expense desde la API
  // useEffect(() => {
  //   const loadExpenseFromPayment = async () => {
  //     ...
  //   };
  //   loadExpenseFromPayment();
  // }, [operatorData.paymentIds, operatorData.expense]);

  // Efecto para recalcular cuando cambien los bonos Y expense
  useEffect(() => {
    const baseTotal = operatorData.total || 0;
    const dailyBonusTotal = Object.values(dailyBonuses).reduce((sum, bonus) => sum + (bonus || 0), 0);
    const newGrandTotal = baseTotal + dailyBonusTotal - expense;
    setGrandTotal(newGrandTotal);
  }, [dailyBonuses, operatorData.total, expense]);

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

  // Función para calcular el total de bonos diarios
  const calculateDailyBonusTotal = () => {
    // Si quieres incluir el adicional, suma aquí:
    // return Object.values(dailyBonuses).reduce((sum, bonus) => sum + (bonus || 0), 0) + (operatorData.additionalBonuses || 0);
    // Si NO quieres incluir el adicional, solo suma los dailyBonuses:
    return Object.values(dailyBonuses).reduce((sum, bonus) => sum + (bonus || 0), 0);
  };

  const handleDailyBonusChange = (day: keyof WeekAmounts, value: number) => {
      setDailyBonuses(prev => ({
        ...prev,
        [day]: value
      }));
    };
    const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      // Genera el PDF como Blob usando PayrollEmailPDF
      const pdfDoc = (
        <PayrollEmailPDF
          operator={{
            ...operatorData,
            netTotal: grandTotal,
            cost: operatorData.cost || 0, // CORREGIR: usar cost en lugar de salary
            // Asegurar que todos los campos requeridos estén presentes
            additionalBonuses: operatorData.additionalBonuses || 0, 
            assignmentIds: operatorData.assignmentIds || [],
            paymentIds: operatorData.paymentIds || [],
            expense: operatorData.expense || 0,
          }}
          weekInfo={{ start_date: periodStart, end_date: periodEnd }}
          weekDates={weekDates} // CORREGIR: pasar weekDates real
        />
      );
      const pdfBlob = await pdf(pdfDoc).toBlob();
      const pdfFile = new File([pdfBlob], `payment-summary-${operatorData.code}.pdf`, { type: 'application/pdf' });
      const subject = `Payment Receipt for ${operatorData.name} ${operatorData.lastName}`;
      const body = `Dear ${operatorData.name},\n\nPlease find attached your payment receipt.`;
      const to = operatorData.email;
      const result = await sendPdfEmail(pdfFile, body, subject, to);
      if (result.success) {
        toast.success('Email sent successfully!');
      } else {
        toast.error(result.errorMessage || 'Error sending email');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };
  // Cambia la función para obtener los ids de las asignaciones del día:
  const handleSaveDailyBonus = async (day: keyof WeekAmounts) => {
    const assigns = assignmentsByDay?.[day];
    if (!assigns || assigns.length === 0) {
      toast.error('No assignment for this day');
      return;
    }
    setSavingBonus(prev => ({ ...prev, [day]: true }));
    try {
      await Promise.all(
        assigns.map(assign =>
          updateAssign(Number(assign.id), { bonus: dailyBonuses[day] || 0 })
        )
      );
      toast.success(`Bonus for ${day} updated!`);
    } catch (e: any) {
      toast.error(`Error updating bonus for ${day}: ${e.message}`);
    } finally {
      setSavingBonus(prev => ({ ...prev, [day]: false }));
    }
  };

  const handlePayment = async () => {
    if (!operatorData.assignmentIds) return;
    setLoading(true);
    setError(null);
    try {
      const dailyBonusTotal = calculateDailyBonusTotal();
      const payload = {
        id_assigns: operatorData.assignmentIds as number[],
        value: grandTotal,
        bonus: dailyBonusTotal, // solo daily bonuses
        expense: expense, 
        status: 'paid',
        date_start: periodStart,
        date_end: periodEnd,
        daily_bonuses: dailyBonuses,
      };
      await createPayment(payload);
      setIsPaid(true);
      toast.success('Payment saved successfully! 🎉');
      if (onPaymentComplete) onPaymentComplete({ ...operatorData, pay: '✅' });
    } catch (e: any) {
      setError(e.message || 'Payment failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN para enviar por WhatsApp
  const handleSendWhatsapp = async () => {
    if (!whatsappNumber.trim()) {
      toast.error('Please enter a WhatsApp number');
      return;
    }

    setSendingWhatsapp(true);
    try {
      // Genera el PDF como Blob usando PayrollEmailPDF
      const pdfDoc = (
        <PayrollEmailPDF
          operator={{
            ...operatorData,
            netTotal: grandTotal,
            cost: operatorData.cost || 0,
            additionalBonuses: operatorData.additionalBonuses || 0, 
            assignmentIds: operatorData.assignmentIds || [],
            paymentIds: operatorData.paymentIds || [],
            expense: operatorData.expense || 0,
          }}
          weekInfo={{ start_date: periodStart, end_date: periodEnd }}
          weekDates={weekDates}
        />
      );
      
      const pdfBlob = await pdf(pdfDoc).toBlob();
      const caption = `Payment Receipt for ${operatorData.name} ${operatorData.lastName} - Period: ${periodStart} to ${periodEnd}`;
      
      const result = await sendPdfToWhatsapp({
        pdfFile: pdfBlob,
        to_number: whatsappNumber,
        caption: caption
      });
      
      if (result.status === 'success') {
        toast.success('WhatsApp message sent successfully!');
        setWhatsappNumber(''); // Limpiar el campo después del éxito
      } else {
        toast.error(result.messUser || 'Error sending WhatsApp message');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error sending WhatsApp message');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  return (
    <>
      <ToastContainer 
        position="top-right" 
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Backdrop con blur */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        {/* Modal Container */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">💰 Payment Summary</h2>
                <p className="text-blue-100 text-sm mt-1">Review and process payment</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Operator Info Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {operatorData.name[0]}{operatorData.lastName[0]}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {operatorData.name} {operatorData.lastName}
                  </h3>
                  <p className="text-gray-600">Code: {operatorData.code}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">Role:</span>
                  <p className="text-gray-900 font-semibold">{operatorData.role}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Period:</span>
                  <p className="text-gray-900 font-semibold">{periodStart} → {periodEnd}</p>
                </div>
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="space-y-3 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Daily Breakdown
              </h4>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {days.map(({ key, label }, index) => (
                  <div 
                    key={key} 
                    className={`flex justify-between items-center px-4 py-3 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } ${index !== days.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">{label}</span>
                      <div className="text-sm text-gray-500">
                        Base: {formatCurrency(operatorData[key])}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Input para bono del día */}
                      <div className="flex flex-col items-end">
                        <div className="relative flex items-center">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-green-600 text-xs">$</span>
                          <input
                            type="number"
                            value={dailyBonuses[key] || ''}
                            onChange={(e) => handleDailyBonusChange(key, parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            disabled={loading || isPaid || savingBonus[key]}
                            className="w-20 pl-5 pr-2 py-1 text-xs border border-green-300 rounded-md text-right font-medium text-green-700 bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            placeholder="0"
                          />
                          {/* Botón para guardar bonus */}
                          <button
                            type="button"
                            disabled={loading || isPaid || savingBonus[key]}
                            onClick={() => handleSaveDailyBonus(key)}
                            className="ml-2 text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Guardar bonus"
                          >
                            {savingBonus[key] ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <span className="text-xs text-green-600 mt-1">Bonus</span>
                      </div>
                      {/* Total del día */}
                      <div className="text-right min-w-[80px]">
                        <div className="font-bold text-gray-900">
                          {formatCurrency((operatorData[key] || 0) + (dailyBonuses[key] || 0))}
                        </div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            <div className="space-y-3">
              {/* Subtotal Base */}
              <div className="flex justify-between items-center px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="font-semibold text-blue-800">Base Subtotal</span>
                <span className="font-bold text-blue-900 text-lg">{formatCurrency(operatorData.total)}</span>
              </div>

              {/* Total de bonos diarios */}
              <div className="flex justify-between items-center px-4 py-3 bg-green-50 rounded-lg border border-green-200">
                <span className="font-semibold text-green-800">Daily Bonuses Total</span>
                <span className="font-bold text-green-900 text-lg">{formatCurrency(calculateDailyBonusTotal())}</span>
              </div>

              {/* SIMPLIFICAR: Expense input sin loading ya que viene de la page */}
              <div className="flex justify-between items-center px-4 py-3 bg-red-50 rounded-lg border border-red-200">
                <span className="font-semibold text-red-800">Expenses</span>
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">$</span>
                  <input
                    type="number"
                    value={expense || ''}
                    onChange={(e) => setExpense(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    disabled={loading || isPaid}
                    className="w-24 px-3 py-1 text-right border border-red-300 rounded-md font-semibold text-red-700 bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center px-4 py-4 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg text-white">
                <span className="font-bold text-xl">Grand Total</span>
                <span className="font-bold text-2xl">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Botón de WhatsApp - Solo mostrar si hay teléfono */}
            {isPaid && operatorData.phone && (
              <button
                onClick={handleSendWhatsapp}
                disabled={sendingWhatsapp}
                className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                  sendingWhatsapp
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
                }`}
              >
                {sendingWhatsapp ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
                    </svg>
                    Send WhatsApp ({operatorData.phone})
                  </>
                )}
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            {isPaid ? (
              <>
                <PDFDownloadLink
                  document={
                    <PayrollPDF 
                      operatorData={{ 
                        ...operatorData, 
                        additionalBonuses: operatorData.additionalBonuses, 
                        grandTotal 
                      }} 
                      days={days} 
                      periodStart={periodStart} 
                      periodEnd={periodEnd}
                      dailyBonuses={dailyBonuses}
                      totalDailyBonuses={calculateDailyBonusTotal()}
                    />
                  }
                  fileName={`payment-summary-${operatorData.code}-${getCurrentDate()}.pdf`}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-center flex items-center justify-center"
                >
                  {({ loading: pdfLoading }) => (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
                    </>
                  )}
                </PDFDownloadLink>

                {/* Enviar email solo cuando ya está pagado */}
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                    sendingEmail
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'
                  }`}
                >
                  {sendingEmail ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Enviar Email
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancelPayment}
                  disabled={cancelLoading}
                  className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                    cancelLoading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {cancelLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Payment
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button 
                  disabled 
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-semibold flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  PDF Locked
                </button>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                    loading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Process Payment
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
