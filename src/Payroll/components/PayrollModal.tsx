// PayrollModal.tsx actualizado

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'; // Quitamos PDFDownloadLink
import { cancelPayments, createPayment } from '../../service/PayrollService';
import { updateAssign } from '../../service/AssignService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sendPdfEmail } from '../../service/EmailRepository';
import { fetchWithAuth } from '../../service/authService';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
async function urlToBase64(url: string): Promise<string> {
  const res  = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function sendPdfViaWhatsapp({
  pdfBlob, phoneNumber, operatorName, periodStart, periodEnd,
}: {
  pdfBlob: Blob; phoneNumber: string; operatorName: string;
  periodStart: string; periodEnd: string;
}): Promise<{ status: 'success' | 'error'; messUser?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', pdfBlob, `recibo-${Date.now()}.pdf`);

    const res = await fetchWithAuth(`${import.meta.env.VITE_URL_BASE}/s3/upload-temp/`, {
      method: 'POST', body: formData,
    });
    if (!res.ok) throw new Error('Error uploading file');

    const data    = await res.json();
    const pdfUrl  = data.url;
    const phone   = phoneNumber.replace(/[^\d+]/g, '');
    const message = encodeURIComponent(
      `Hola ${operatorName} , aquí tienes tu recibo de pago para el período *${periodStart} → ${periodEnd}*.\n\n Descárgalo aquí: ${pdfUrl}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    return { status: 'success' };
  } catch (err: any) {
    return { status: 'error', messUser: err.message || 'Error desconocido' };
  }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface WeekAmounts {
  Mon?: number; Tue?: number; Wed?: number; Thu?: number;
  Fri?: number; Sat?: number; Sun?: number;
}

interface CompanyInfo {
  name: string; address: string; license_number: string; logo_url: string;
}

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: (updatedOperator: any) => void;
  operatorData: {
    email: string; phone?: string; code: string; name: string; lastName: string;
    role: string; cost: number; Mon?: number; Tue?: number; Wed?: number;
    Thu?: number; Fri?: number; Sat?: number; Sun?: number; total?: number;
    additionalBonuses: number; grandTotal?: number;
    assignmentIds: (number | string)[];
    paymentIds: (number | string)[];
    expense?: number;
    assignmentIdsByDay?: { [key in keyof WeekAmounts]?: (number | string)[] };
    operator_phone?: string | null;
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

// ─────────────────────────────────────────────
// PDF Styles
// ─────────────────────────────────────────────
const C = {
  navy: '#0B2863', navyLight: '#0f3a8a', light: '#f8fafc',
  red: '#c0392b', redBg: '#fdecea',
  green: '#27ae60', greenBg: '#eafaf1',
  gray: '#64748b', border: '#cbd5e1', white: '#ffffff',
};

const pdfStyles = StyleSheet.create({
  page:        { flexDirection: 'column', backgroundColor: C.white, fontFamily: 'Helvetica', paddingBottom: 40 },
  headerBand:  { backgroundColor: C.navy, paddingHorizontal: 36, paddingVertical: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo:        { width: 56, height: 56, borderRadius: 6 },
  logoFallback:{ width: 56, height: 56, borderRadius: 6, backgroundColor: '#1a4a9e', alignItems: 'center', justifyContent: 'center' },
  logoFallbackText: { color: C.white, fontSize: 14, fontFamily: 'Helvetica-Bold' },
  headerRight: { alignItems: 'flex-end' },
  companyName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.white },
  companyMeta: { fontSize: 8, color: '#94a3b8', marginTop: 2 },
  titleStrip:  { backgroundColor: C.navyLight, paddingHorizontal: 36, paddingVertical: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleText:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.5 },
  dateText:    { fontSize: 8, color: '#93c5fd' },
  body:        { paddingHorizontal: 36, paddingTop: 18 },
  operatorCard:{ backgroundColor: C.light, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: C.navy, padding: 14, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between' },
  operatorCol: { flex: 1 },
  fieldLabel:  { fontSize: 7, color: C.gray, marginBottom: 2, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue:  { fontSize: 11, color: '#0f172a', fontFamily: 'Helvetica-Bold' },
  fieldValueSm:{ fontSize: 9, color: '#1e293b' },
  sectionTitle:{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, marginTop: 2 },
  tableHead:   { flexDirection: 'row', backgroundColor: C.navy, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 10, marginBottom: 1 },
  thText:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, flex: 1 },
  thRight:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, textAlign: 'right', width: 65 },
  rowEven:     { flexDirection: 'row', backgroundColor: C.light, paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  rowOdd:      { flexDirection: 'row', backgroundColor: C.white, paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  tdText:      { fontSize: 9, color: '#1e293b', flex: 1 },
  tdRight:     { fontSize: 9, color: '#1e293b', textAlign: 'right', width: 65, fontFamily: 'Helvetica-Bold' },
  tdGreen:     { fontSize: 9, color: C.green, flex: 1 },
  totals:      { marginTop: 14 },
  rowBase:     { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 6, paddingVertical: 9, paddingHorizontal: 14, marginBottom: 5 },
  lbl:         { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  val:         { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  grandRow:    { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.navy, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16, marginTop: 4 },
  grandLbl:    { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.white },
  grandVal:    { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#60a5fa' },
  footer:      { marginTop: 24, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, paddingHorizontal: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerTxt:   { fontSize: 7, color: '#94a3b8' },
  badge:       { backgroundColor: C.navy, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8 },
  badgeTxt:    { fontSize: 7, color: C.white, fontFamily: 'Helvetica-Bold' },
});

interface DayInfo { key: keyof WeekAmounts; label: string; }

// ─────────────────────────────────────────────
// PDF Component
// ─────────────────────────────────────────────
const PayrollPDF: React.FC<{
  operatorData: NonNullable<PayrollModalProps['operatorData']>;
  days: DayInfo[];
  periodStart: string; periodEnd: string;
  dailyBonuses: WeekAmounts; totalDailyBonuses: number;
  expense: number; grandTotal: number;
  company: CompanyInfo | null;
  logoBase64: string | null;
}> = ({ operatorData, days, periodStart, periodEnd, dailyBonuses, totalDailyBonuses, expense, grandTotal, company, logoBase64 }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.headerBand}>
        <View>
          {logoBase64
            ? <Image src={logoBase64} style={pdfStyles.logo} />
            : (
              <View style={pdfStyles.logoFallback}>
                <Text style={pdfStyles.logoFallbackText}>MW</Text>
              </View>
            )
          }
        </View>
        <View style={pdfStyles.headerRight}>
          <Text style={pdfStyles.companyName}>{company?.name || 'MovingWise'}</Text>
          <Text style={pdfStyles.companyMeta}>{company?.address || ''}</Text>
          <Text style={pdfStyles.companyMeta}>Licencia: {company?.license_number || ''}</Text>
        </View>
      </View>

      {/* Title strip */}
      <View style={pdfStyles.titleStrip}>
        <Text style={pdfStyles.titleText}>RECIBO DE PAGO</Text>
        <Text style={pdfStyles.dateText}>
          {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <View style={pdfStyles.body}>
        {/* Operator card */}
        <View style={pdfStyles.operatorCard}>
          <View style={pdfStyles.operatorCol}>
            <Text style={pdfStyles.fieldLabel}>Operador</Text>
            <Text style={pdfStyles.fieldValue}>{operatorData.name} {operatorData.lastName}</Text>
            <Text style={pdfStyles.fieldValueSm}>Código: {operatorData.code}</Text>
          </View>
          <View style={pdfStyles.operatorCol}>
            <Text style={pdfStyles.fieldLabel}>Rol</Text>
            <Text style={pdfStyles.fieldValueSm}>{operatorData.role}</Text>
          </View>
          <View style={[pdfStyles.operatorCol, { alignItems: 'flex-end' }]}>
            <Text style={pdfStyles.fieldLabel}>Período</Text>
            <Text style={pdfStyles.fieldValueSm}>{periodStart}</Text>
            <Text style={pdfStyles.fieldValueSm}>→ {periodEnd}</Text>
          </View>
        </View>

        {/* Daily breakdown table */}
        <Text style={pdfStyles.sectionTitle}>Desglose Diario</Text>
        <View style={pdfStyles.tableHead}>
          <Text style={pdfStyles.thText}>Día</Text>
          <Text style={pdfStyles.thText}>Base</Text>
          <Text style={pdfStyles.thText}>Bono</Text>
          <Text style={pdfStyles.thRight}>Total</Text>
        </View>

        {days.map(({ key, label }, i) => {
          const base  = operatorData[key] || 0;
          const bonus = dailyBonuses[key] || 0;
          return (
            <View key={key} style={i % 2 === 0 ? pdfStyles.rowEven : pdfStyles.rowOdd}>
              <Text style={pdfStyles.tdText}>{label}</Text>
              <Text style={pdfStyles.tdText}>{formatCurrency(base)}</Text>
              <Text style={pdfStyles.tdGreen}>{formatCurrency(bonus)}</Text>
              <Text style={pdfStyles.tdRight}>{formatCurrency(base + bonus)}</Text>
            </View>
          );
        })}

        {/* Totals */}
        <View style={pdfStyles.totals}>
          <View style={[pdfStyles.rowBase, { backgroundColor: '#e8eef8' }]}>
            <Text style={[pdfStyles.lbl, { color: C.navy }]}>Subtotal Base</Text>
            <Text style={[pdfStyles.val, { color: C.navy }]}>{formatCurrency(operatorData.total)}</Text>
          </View>
          <View style={[pdfStyles.rowBase, { backgroundColor: C.greenBg }]}>
            <Text style={[pdfStyles.lbl, { color: C.green }]}>✓ Bonos Diarios</Text>
            <Text style={[pdfStyles.val, { color: C.green }]}>+ {formatCurrency(totalDailyBonuses)}</Text>
          </View>
          {expense > 0 && (
            <View style={[pdfStyles.rowBase, { backgroundColor: C.redBg }]}>
              <Text style={[pdfStyles.lbl, { color: C.red }]}>✗ Gastos Deducidos</Text>
              <Text style={[pdfStyles.val, { color: C.red }]}>- {formatCurrency(expense)}</Text>
            </View>
          )}
          <View style={pdfStyles.grandRow}>
            <Text style={pdfStyles.grandLbl}>PAGO NETO</Text>
            <Text style={pdfStyles.grandVal}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerTxt}>
          Generado el {new Date().toLocaleString('es-ES')}
        </Text>
        <View style={pdfStyles.badge}>
          <Text style={pdfStyles.badgeTxt}>MovingWise</Text>
        </View>
      </View>
    </Page>
  </Document>
);

// ─────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────
export const PayrollModal: React.FC<PayrollModalProps> = ({
  onClose, operatorData, onPaymentComplete, periodStart, periodEnd, weekDates, assignmentsByDay,
}) => {
  const [grandTotal, setGrandTotal]           = useState(operatorData.grandTotal || 0);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [isPaid, setIsPaid]                   = useState<boolean>(!!operatorData.paymentIds?.length);
  const [cancelLoading, setCancelLoading]     = useState(false);
  const [expense, setExpense]                 = useState<number>(operatorData.expense || 0);
  const [sendingEmail, setSendingEmail]       = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [company, setCompany]                 = useState<CompanyInfo | null>(null);
  const [logoBase64, setLogoBase64]           = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF]   = useState(false);

  const [dailyBonuses, setDailyBonuses] = useState<WeekAmounts>(() => {
    const init: WeekAmounts = {};
    (['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as (keyof WeekAmounts)[]).forEach(d => {
      const a = assignmentsByDay?.[d]?.[0];
      init[d] = a && typeof a.bonus === 'number' ? a.bonus : 0;
    });
    return init;
  });

  const [savingBonus, setSavingBonus] = useState<{ [k in keyof WeekAmounts]?: boolean }>({});

  const days: DayInfo[] = [
    { key: 'Mon', label: 'Lunes'    }, { key: 'Tue', label: 'Martes'   },
    { key: 'Wed', label: 'Miércoles' }, { key: 'Thu', label: 'Jueves'  },
    { key: 'Fri', label: 'Viernes'    }, { key: 'Sat', label: 'Sábado'  },
    { key: 'Sun', label: 'Domingo'    },
  ];

  // Load company info + convert logo to base64
  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_URL_BASE}/companies/my-company/`)
      .then(r => r.ok ? r.json() : null)
      .then(async d => {
        if (!d) return;
        setCompany({ name: d.name, address: d.address, license_number: d.license_number, logo_url: d.logo_url });
        if (d.logo_url) {
          try {
            const b64 = await urlToBase64(d.logo_url);
            setLogoBase64(b64);
          } catch {
            // logo fallback silently
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const bonusSum = Object.values(dailyBonuses).reduce((s, b) => s + (b || 0), 0);
    setGrandTotal((operatorData.total || 0) + bonusSum - expense);
  }, [dailyBonuses, operatorData.total, expense]);

  const bonusTotal     = () => Object.values(dailyBonuses).reduce((s, b) => s + (b || 0), 0);
  const getCurrentDate = () => {
    const t = new Date();
    return `${String(t.getDate()).padStart(2,'0')}-${String(t.getMonth()+1).padStart(2,'0')}-${t.getFullYear()}`;
  };

  const handleDailyBonusChange = (day: keyof WeekAmounts, value: number) =>
    setDailyBonuses(p => ({ ...p, [day]: value }));

  const handleSaveDailyBonus = async (day: keyof WeekAmounts) => {
    const assigns = assignmentsByDay?.[day];
    if (!assigns?.length) { toast.error('No hay asignación para este día'); return; }
    setSavingBonus(p => ({ ...p, [day]: true }));
    try {
      await Promise.all(assigns.map(a => updateAssign(Number(a.id), { bonus: dailyBonuses[day] || 0 })));
      toast.success(`¡Bono para ${day} actualizado!`);
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setSavingBonus(p => ({ ...p, [day]: false }));
    }
  };

  const handleCancelPayment = async () => {
    if (!operatorData.assignmentIds?.length) return;
    setCancelLoading(true);
    try {
      const result = await cancelPayments(operatorData.assignmentIds.map(Number));
      if (result.status === 'success') {
        const { summary } = result.data;
        if (summary.total_errors === 0) {
          toast.success(`¡Cancelado! Procesados: ${summary.total_processed}`);
        } else {
          toast.warning(`Completado con ${summary.total_errors} error(es).`);
        }
        setIsPaid(false);
        onPaymentComplete?.({ ...operatorData, pay: null });
      } else {
        toast.error(result.messUser || 'Error al cancelar');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!operatorData.assignmentIds) return;
    setLoading(true); setError(null);
    try {
      const dailyBonusesArray = days
        .map(({ key }) => ({
          date: weekDates[key] || '',
          bonus: dailyBonuses[key] || 0,
          assign_ids: (assignmentsByDay?.[key] || []).map(a => Number(a.id)),
        }))
        .filter(i => i.assign_ids.length > 0);

      await createPayment({
        value: grandTotal, status: 'paid',
        date_start: periodStart, date_end: periodEnd,
        expense: expense || 0, daily_bonuses: dailyBonusesArray,
      });
      setIsPaid(true);
      toast.success('¡Pago guardado! 🎉');
      onPaymentComplete?.({ ...operatorData, pay: '' });
    } catch (e: any) {
      setError(e.message || 'Error en el pago');
      toast.error('Error en el pago.');
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar PDF directamente
  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      // Crear el documento PDF
      const pdfDocument = (
        <PayrollPDF
          operatorData={{ ...operatorData, grandTotal }}
          days={days}
          periodStart={periodStart}
          periodEnd={periodEnd}
          dailyBonuses={dailyBonuses}
          totalDailyBonuses={bonusTotal()}
          expense={expense}
          grandTotal={grandTotal}
          company={company}
          logoBase64={logoBase64}
        />
      );

      // Generar el blob
      const blob = await pdf(pdfDocument).toBlob();
      
      // Crear URL y descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pago-${operatorData.code}-${getCurrentDate()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const buildPdfBlob = async () => {
    const pdfDocument = (
      <PayrollPDF
        operatorData={{ ...operatorData, grandTotal }}
        days={days}
        periodStart={periodStart}
        periodEnd={periodEnd}
        dailyBonuses={dailyBonuses}
        totalDailyBonuses={bonusTotal()}
        expense={expense}
        grandTotal={grandTotal}
        company={company}
        logoBase64={logoBase64}
      />
    );
    return await pdf(pdfDocument).toBlob();
  };

  const handleSendEmail = async () => {
    setSendingEmail(true); setShowSendOptions(false);
    try {
      const blob = await buildPdfBlob();
      const file = new File([blob], `payment-${operatorData.code}.pdf`, { type: 'application/pdf' });
      const res  = await sendPdfEmail(
        file,
        `Estimado ${operatorData.name},\n\nAdjunto encuentra su recibo de pago.`,
        `Recibo de Pago — ${operatorData.name} ${operatorData.lastName}`,
        operatorData.email
      );
      if (res.success) {
        toast.success('¡Email enviado!');
      } else {
        toast.error(res.errorMessage || 'Error enviando email');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!operatorData.operator_phone) { toast.error('No hay número de WhatsApp para este operador'); return; }
    setSendingWhatsapp(true); setShowSendOptions(false);
    try {
      const blob = await buildPdfBlob();
      const res  = await sendPdfViaWhatsapp({
        pdfBlob: blob,
        phoneNumber: operatorData.operator_phone,
        operatorName: `${operatorData.name} ${operatorData.lastName}`,
        periodStart, periodEnd,
      });
      if (res.status === 'success') {
        toast.success('¡WhatsApp abierto! 📲');
      } else {
        toast.error(res.messUser || 'Error enviando WhatsApp');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  // ── Reusable UI pieces ──────────────────────
  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );

  const WAIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515z"/>
    </svg>
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} theme="light" />

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 text-white" style={{ background: 'linear-gradient(135deg, #0B2863 0%, #1a4a9e 100%)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Resumen de Pago</h2>
                <p className="text-blue-200 text-sm mt-0.5">Revisar y procesar pago</p>
              </div>
              <button onClick={onClose} className="hover:bg-white/20 rounded-full p-2 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md flex gap-3">
                <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Operator card */}
            <div className="rounded-xl p-5 mb-6 border border-slate-200" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e8eef8 100%)' }}>
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0B2863, #1a4a9e)' }}>
                  {operatorData.name[0]}{operatorData.lastName[0]}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-bold text-gray-900">{operatorData.name} {operatorData.lastName}</h3>
                  <p className="text-gray-500 text-xs">Código: {operatorData.code} · {operatorData.role}</p>
                </div>
              </div>
              <span className="text-xs text-gray-600 bg-white/80 rounded-lg px-3 py-1.5 inline-block border border-slate-200">
                📅 {periodStart} → {periodEnd}
              </span>
            </div>

            {/* Daily Breakdown */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#0B2863' }}>
                Desglose Diario
              </h4>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {days.map(({ key, label }, i) => (
                  <div key={key} className={`flex justify-between items-center px-4 py-3 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'} ${i < days.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex-1">
                      <p className="font-medium text-gray-700 text-sm">{label}</p>
                      <p className="text-xs text-gray-400">Base: {formatCurrency(operatorData[key])}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <div className="relative flex items-center">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-green-600 text-xs">$</span>
                          <input
                            type="number" value={dailyBonuses[key] || ''} min="0" step="0.01" placeholder="0"
                            onChange={e => handleDailyBonusChange(key, parseFloat(e.target.value) || 0)}
                            disabled={loading || isPaid || savingBonus[key]}
                            className="w-20 pl-5 pr-2 py-1 text-xs border border-green-300 rounded-md text-right font-medium text-green-700 bg-green-50 disabled:opacity-50 focus:ring-1 focus:ring-green-400 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDailyBonus(key)}
                            disabled={loading || isPaid || savingBonus[key]}
                            className="ml-1.5 text-green-600 hover:text-green-800 disabled:opacity-40"
                          >
                            {savingBonus[key]
                              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                            }
                          </button>
                        </div>
                        <span className="text-xs text-green-600 mt-0.5">Bono</span>
                      </div>
                      <div className="text-right min-w-[72px]">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency((operatorData[key]||0)+(dailyBonuses[key]||0))}</p>
                        <p className="text-xs text-gray-400">Total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-4 py-3 rounded-lg border" style={{ backgroundColor: '#e8eef8', borderColor: '#c7d8f0' }}>
                <span className="font-semibold text-sm" style={{ color: '#0B2863' }}>Subtotal Base</span>
                <span className="font-bold" style={{ color: '#0B2863' }}>{formatCurrency(operatorData.total)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 rounded-lg border" style={{ backgroundColor: '#eafaf1', borderColor: '#a9dfbf' }}>
                <span className="font-semibold text-sm" style={{ color: '#27ae60' }}>✓ Bonos Diarios</span>
                <span className="font-bold" style={{ color: '#27ae60' }}>+ {formatCurrency(bonusTotal())}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 rounded-lg border" style={{ backgroundColor: '#fdecea', borderColor: '#f5c6cb' }}>
                <span className="font-semibold text-sm" style={{ color: '#c0392b' }}>✗ Gastos</span>
                <div className="flex items-center gap-1">
                  <span style={{ color: '#c0392b' }} className="text-sm">-$</span>
                  <input
                    type="number" value={expense || ''} min="0" step="0.01" placeholder="0.00"
                    onChange={e => setExpense(parseFloat(e.target.value) || 0)}
                    disabled={loading || isPaid}
                    className="w-24 px-2 py-1 text-right border rounded-md text-sm font-semibold disabled:opacity-50 outline-none focus:ring-1"
                    style={{ borderColor: '#f5c6cb', color: '#c0392b', backgroundColor: '#fdecea' }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center px-4 py-4 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #0B2863 0%, #1a4a9e 100%)' }}>
                <span className="font-bold text-lg">PAGO NETO</span>
                <span className="font-bold text-2xl" style={{ color: '#93c5fd' }}>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            {isPaid ? (
              <>
                {/* Botón de Descargar PDF */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="flex-1 px-4 py-3 text-white rounded-lg font-semibold text-center flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#0B2863' }}
                >
                  {downloadingPDF ? (
                    <>
                      <Spinner />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span>Descargar PDF</span>
                    </>
                  )}
                </button>

                {/* Send dropdown */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowSendOptions(!showSendOptions)}
                    disabled={sendingEmail || sendingWhatsapp}
                    className="w-full px-4 py-3 font-semibold rounded-lg text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#1a4a9e' }}
                  >
                    {sendingEmail || sendingWhatsapp ? (
                      <>
                        <Spinner />
                        <span>{sendingEmail ? 'Enviando Email...' : 'Subiendo...'}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                        <span>Enviar a Operador</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                      </>
                    )}
                  </button>

                  {showSendOptions && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                      {/* Email */}
                      <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail || sendingWhatsapp}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">Enviar por Email</p>
                          <p className="text-xs text-gray-400 truncate">{operatorData.email}</p>
                        </div>
                      </button>

                      {/* WhatsApp */}
                      {operatorData.operator_phone ? (
                        <button
                          onClick={handleSendWhatsapp}
                          disabled={sendingEmail || sendingWhatsapp}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <span className="text-green-600 flex-shrink-0">
                            <WAIcon />
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">Enviar por WhatsApp</p>
                            <p className="text-xs text-gray-400">{operatorData.operator_phone}</p>
                          </div>
                        </button>
                      ) : (
                        <div className="px-4 py-3 flex items-center gap-3 opacity-40 cursor-not-allowed">
                          <span className="text-gray-400 flex-shrink-0">
                            <WAIcon />
                          </span>
                          <div>
                            <p className="font-medium text-gray-400 text-sm">WhatsApp no disponible</p>
                            <p className="text-xs text-gray-400">Número no registrado</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cancel payment */}
                <button
                  onClick={handleCancelPayment}
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-3 font-semibold rounded-lg text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#c0392b' }}
                >
                  {cancelLoading ? (
                    <><Spinner /><span>Cancelando...</span></>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      <span>Cancelar Pago</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button disabled className="flex-1 px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-semibold flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  PDF Bloqueado
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 px-4 py-3 font-semibold rounded-lg text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#27ae60' }}
                >
                  {loading ? (
                    <><Spinner /><span>Procesando...</span></>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <span>Procesar Pago</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showSendOptions && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSendOptions(false)} />
      )}
    </>
  );
};