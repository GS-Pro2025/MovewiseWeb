import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { OperatorRowExtended } from '../types/payroll.types';
import { WeekAmounts } from '../../models/payrroll';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2563eb',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  operatorInfo: {
    marginBottom: 20,
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    width: 80,
  },
  infoValue: {
    fontSize: 11,
    color: '#1f2937',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    marginTop: 15,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 2,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  dayAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  summarySection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#1e40af',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#6b7280',
  },
});

interface PayrollEmailPDFProps {
  operator: OperatorRowExtended;
  weekInfo: {
    start_date: string;
    end_date: string;
  };
  weekDates: { [key: string]: string };
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const PayrollEmailPDF: React.FC<PayrollEmailPDFProps> = ({
  operator,
  weekInfo,
  weekDates,
}) => {
  const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const workedDays = weekdayKeys.filter(day => operator[day] && operator[day]! > 0);
  const totalWorkedDays = workedDays.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>WEEKLY PAYMENT SUMMARY</Text>
        
        {/* Operator Information */}
        <View style={styles.operatorInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee:</Text>
            <Text style={styles.infoValue}>{operator.name} {operator.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Code:</Text>
            <Text style={styles.infoValue}>{operator.code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{operator.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Period:</Text>
            <Text style={styles.infoValue}>
              {formatDate(weekInfo.start_date)} - {formatDate(weekInfo.end_date)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Days Worked:</Text>
            <Text style={styles.infoValue}>{totalWorkedDays} days</Text>
          </View>
        </View>

        {/* Daily Breakdown */}
        <Text style={styles.sectionTitle}>DAILY WORK BREAKDOWN</Text>
        {weekdayKeys.map((day) => {
          const amount = operator[day] || 0;
          const date = weekDates[day];
          
          return (
            <View 
              key={day} 
              style={[
                styles.dayRow, 
                { backgroundColor: amount > 0 ? '#dcfce7' : '#f3f4f6' }
              ]}
            >
              <View>
                <Text style={styles.dayLabel}>
                  {day} - {date ? new Date(date).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <Text style={[
                styles.dayAmount,
                { color: amount > 0 ? '#059669' : '#9ca3af' }
              ]}>
                {amount > 0 ? formatCurrency(amount) : 'Not worked'}
              </Text>
            </View>
          );
        })}

        {/* Payment Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Salary (per day):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(operator.cost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Base Pay:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(operator.total || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Additional Bonuses:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(operator.additionalBonuses || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gross Total:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(operator.grandTotal || 0)}</Text>
          </View>
          {operator.expense && operator.expense > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#dc2626' }]}>Deductions:</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                -{formatCurrency(operator.expense)}
              </Text>
            </View>
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>NET PAYMENT:</Text>
            <Text style={styles.totalValue}>{formatCurrency(operator.netTotal || 0)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This payment summary was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}.
          {'\n'}For questions about this payment, please contact your supervisor.
        </Text>
      </Page>
    </Document>
  );
};