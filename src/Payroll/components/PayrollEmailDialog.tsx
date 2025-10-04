/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { sendPdfEmail } from '../../service/EmailRepository';
import { PayrollEmailPDF } from './PayrollEmailPDF';
import { OperatorRowExtended } from '../types/payroll.types';
import { useSnackbar } from 'notistack';

interface PayrollEmailDialogProps {
  open: boolean;
  onClose: () => void;
  operator: OperatorRowExtended | null;
  weekInfo: {
    start_date: string;
    end_date: string;
  } | null;
  weekDates: { [key: string]: string };
}

// Plantillas de asunto predefinidas
// const EMAIL_SUBJECTS = [
//   'Weekly Payment Summary - {{operatorName}}',
//   'Payroll Statement - Week {{weekStart}} to {{weekEnd}}',
//   'Your Weekly Payment Details - {{operatorName}}',
//   'Weekly Earnings Report - {{operatorCode}}',
//   'Payment Summary for {{weekStart}} - {{weekEnd}}',
// ];

export const PayrollEmailDialog: React.FC<PayrollEmailDialogProps> = ({
  open,
  onClose,
  operator,
  weekInfo,
  weekDates,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [selectedSubject, setSelectedSubject] = useState(0);
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  // Default templates (single subject + body). Use {{operator_name}} as placeholder.
  const DEFAULT_SUBJECT = 'Weekly Payment Summary - {{operator_name}}';
  const DEFAULT_BODY = `Dear {{operator_name}},
  
Please find attached your weekly payment summary for the period from {{week_start}} to {{week_end}}.

Payment Details:
- Base Pay: {{base_pay}}
- Bonuses: {{bonuses}}
- Gross Total: {{gross_total}}
- Net Payment: {{net_payment}}

Days Worked: {{days_worked}}
Role: {{role}}

If you have any questions about this payment, please contact your supervisor.

Best regards,
Payroll Department`;

  // Populate inputs when operator or weekInfo changes
  useEffect(() => {
    if (!operator || !weekInfo) return;

    // build replacements (same logic as generateEmailContent)
    const operatorName = `${operator.name} ${operator.lastName}`;
    const weekStart = new Date(weekInfo.start_date).toLocaleDateString();
    const weekEnd = new Date(weekInfo.end_date).toLocaleDateString();
    const basePay = `$${(operator.total || 0).toLocaleString()}`;
    const bonuses = `$${(operator.additionalBonuses || 0).toLocaleString()}`;
    const grossTotal = `$${(operator.grandTotal || 0).toLocaleString()}`;
    const netPayment = `$${(operator.netTotal || 0).toLocaleString()}`;
    const weekdayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysWorked = weekdayKeys.filter(day => operator[day] && operator[day]! > 0).length;

    const replacements: Record<string, string> = {
      '{{operator_name}}': operatorName,
      '{{operatorName}}': operatorName,
      '{{operator_code}}': operator.code,
      '{{operatorCode}}': operator.code,
      '{{week_start}}': weekStart,
      '{{weekStart}}': weekStart,
      '{{week_end}}': weekEnd,
      '{{weekEnd}}': weekEnd,
      '{{base_pay}}': basePay,
      '{{basePay}}': basePay,
      '{{bonuses}}': bonuses,
      '{{gross_total}}': grossTotal,
      '{{grossTotal}}': grossTotal,
      '{{net_payment}}': netPayment,
      '{{netPayment}}': netPayment,
      '{{days_worked}}': daysWorked.toString(),
      '{{daysWorked}}': daysWorked.toString(),
      '{{role}}': operator.role,
    };

    const replacePlaceholders = (text: string) => {
      let out = text;
      Object.entries(replacements).forEach(([ph, val]) => {
        out = out.split(ph).join(val);
      });
      return out;
    };

    // Prefill inputs with replaced text so user sees resolved values
    setCustomSubject((prev) => prev ? replacePlaceholders(prev) : replacePlaceholders(DEFAULT_SUBJECT));
    setCustomBody((prev) => prev ? replacePlaceholders(prev) : replacePlaceholders(DEFAULT_BODY));
  }, [operator, weekInfo]);
  
  // Generar contenido dinámico del email
  const generateEmailContent = () => {
    if (!operator || !weekInfo) return { subject: '', body: '' };

    const operatorName = `${operator.name} ${operator.lastName}`;
    const weekStart = new Date(weekInfo.start_date).toLocaleDateString();
    const weekEnd = new Date(weekInfo.end_date).toLocaleDateString();
    const basePay = `$${(operator.total || 0).toLocaleString()}`;
    const bonuses = `$${(operator.additionalBonuses || 0).toLocaleString()}`;
    const grossTotal = `$${(operator.grandTotal || 0).toLocaleString()}`;
    const netPayment = `$${(operator.netTotal || 0).toLocaleString()}`;
    
    // Calcular días trabajados
    const weekdayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysWorked = weekdayKeys.filter(day => operator[day] && operator[day]! > 0).length;

    // replacements support both snake_case and camelCase placeholders
    const replacements: Record<string, string> = {
      '{{operator_name}}': operatorName,
      '{{operatorName}}': operatorName,
      '{{operator_code}}': operator.code,
      '{{operatorCode}}': operator.code,
      '{{week_start}}': weekStart,
      '{{weekStart}}': weekStart,
      '{{week_end}}': weekEnd,
      '{{weekEnd}}': weekEnd,
      '{{base_pay}}': basePay,
      '{{basePay}}': basePay,
      '{{bonuses}}': bonuses,
      '{{gross_total}}': grossTotal,
      '{{grossTotal}}': grossTotal,
      '{{net_payment}}': netPayment,
      '{{netPayment}}': netPayment,
      '{{days_worked}}': daysWorked.toString(),
      '{{daysWorked}}': daysWorked.toString(),
      '{{role}}': operator.role,
    };

    const replacePlaceholders = (text: string) => {
      let out = text;
      Object.entries(replacements).forEach(([ph, val]) => {
        out = out.split(ph).join(val);
      });
      return out;
    };

    // Use whatever is currently in the inputs (prefilled on open)
    const subject = replacePlaceholders(customSubject || DEFAULT_SUBJECT);
    const body = replacePlaceholders(customBody || DEFAULT_BODY);

    return { subject, body };
  };

  const handleSendEmail = async () => {
    if (!operator || !weekInfo || !operator.email) {
      enqueueSnackbar('Missing operator email or information', { variant: 'error' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generar el PDF usando react-pdf
      const pdfBlob = await new Promise<Blob>((resolve, reject) => {
        import('@react-pdf/renderer').then(({ pdf }) => {
          const MyDocument = (
            <PayrollEmailPDF
              operator={operator}
              weekInfo={weekInfo}
              weekDates={weekDates}
            />
          );
          
          pdf(MyDocument).toBlob().then(resolve).catch(reject);
        });
      });

      const pdfFile = new File([pdfBlob], `payroll-${operator.code}-week-${weekInfo.start_date}.pdf`, {
        type: 'application/pdf',
      });

      const { subject, body } = generateEmailContent();

      const result = await sendPdfEmail(pdfFile, body, subject, operator.email);

      if (result.success) {
        enqueueSnackbar(`Payment summary sent successfully to ${operator.email}`, {
          variant: 'success',
        });
        onClose();
      } else {
        setError(result.errorMessage || 'Failed to send email');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!operator || !weekInfo) return null;

  generateEmailContent();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Send Payment Summary to {operator.name} {operator.lastName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Información del operador */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Email:</strong> {operator.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Net Payment:</strong> ${(operator.netTotal || 0).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Period:</strong> {weekInfo.start_date} to {weekInfo.end_date}
          </Typography>
        </Box>

        {/* Campo de asunto (prefilled) */}
        <TextField
          label="Subject"
          fullWidth
          margin="normal"
          value={customSubject}
          onChange={(e) => setCustomSubject(e.target.value)}
          helperText="You can edit the subject before sending"
        />

        {/* Campo de cuerpo (prefilled) */}
        <TextField
          label="Email Body"
          fullWidth
          multiline
          rows={6}
          margin="normal"
          value={customBody}
          onChange={(e) => setCustomBody(e.target.value)}
          helperText="You can edit the body before sending"
        />

        {/* Vista previa del PDF */}
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <PDFDownloadLink
            document={
              <PayrollEmailPDF
                operator={operator}
                weekInfo={weekInfo}
                weekDates={weekDates}
              />
            }
            fileName={`payroll-${operator.code}-week-${weekInfo.start_date}.pdf`}
          >
            {({ loading: pdfLoading }) => (
              <Button
                variant="outlined"
                size="small"
                disabled={pdfLoading}
                sx={{ mb: 1 }}
              >
                {pdfLoading ? 'Generating PDF...' : 'Preview PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSendEmail}
          variant="contained"
          disabled={loading || !operator.email}
          color="primary"
        >
          {loading ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};