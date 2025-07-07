import React from 'react';
import { 
  Document as PDFDocument, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink,
} from '@react-pdf/renderer';

// Interfaces de TypeScript
interface WeekInfo {
  start_date: string;
  end_date: string;
}

interface WeekAmounts {
  Mon?: number;
  Tue?: number;
  Wed?: number;
  Thu?: number;
  Fri?: number;
  Sat?: number;
  Sun?: number;
}

interface OperatorRow extends WeekAmounts {
  code: string;
  name: string;
  lastName: string;
  role: string;
  cost: number;
  pay?: string | null;
  total?: number;
  additionalBonuses?: number;
  grandTotal?: number;
  assignmentIds: (number | string)[];
  paymentIds: (number | string)[];
  assignmentsByDay?: { 
    [key in keyof WeekAmounts]?: { 
      id: number | string; 
      date: string; 
      bonus?: number;
    }[] 
  };
}

interface PaymentStats {
  paid: number;
  unpaid: number;
  total: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface PayrollPDFExportProps {
  operators: OperatorRow[];
  weekInfo: WeekInfo;
  weekDates: { [key in keyof WeekAmounts]?: string };
  week: number;
  location: string;
  paymentStats: PaymentStats;
  totalGrand: number;
}

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    fontSize: 9,
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 60,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 5,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  periodInfo: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  tableContainer: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 22,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    minHeight: 35,
  },
  tableCol: {
    width: '7%',
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  tableColWide: {
    width: '10%',
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  tableColName: {
    width: '12%',
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  tableCellHeader: {
    fontSize: 7,
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 7,
    color: '#1f2937',
  },
  tableCellBold: {
    fontSize: 7,
    fontWeight: 700,
    color: '#1f2937',
  },
  tableCellGreen: {
    fontSize: 7,
    color: '#059669',
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
  },
  totalsRow: {
    backgroundColor: '#f3f4f6',
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
    marginTop: 5,
    minHeight: 25,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 8,
    color: '#6b7280',
  },
  continuedText: {
    fontSize: 8,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
});

const formatCurrency = (n: number): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
};

const formatDate = (dateStr: string): string => {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
};

// Función para dividir operadores en páginas
const paginateOperators = (operators: OperatorRow[], rowsPerPage: number): OperatorRow[][] => {
  const pages: OperatorRow[][] = [];
  for (let i = 0; i < operators.length; i += rowsPerPage) {
    pages.push(operators.slice(i, i + rowsPerPage));
  }
  return pages;
};

// Componente para el header de la tabla
const TableHeader: React.FC<{ weekDates: { [key in keyof WeekAmounts]?: string } }> = ({ weekDates }) => {
  const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <View style={[styles.tableRow, styles.tableHeader]}>
      <View style={[styles.tableCol, { width: '4%' }]}>
        <Text style={styles.tableCellHeader}>Pay</Text>
      </View>
      <View style={[styles.tableCol, { width: '7%' }]}>
        <Text style={styles.tableCellHeader}>Code</Text>
      </View>
      <View style={styles.tableColName}>
        <Text style={styles.tableCellHeader}>Name</Text>
      </View>
      <View style={styles.tableColName}>
        <Text style={styles.tableCellHeader}>Last Name</Text>
      </View>
      <View style={[styles.tableCol, { width: '8%' }]}>
        <Text style={styles.tableCellHeader}>Cost</Text>
      </View>
      {weekdayKeys.map(day => (
        <View key={day} style={[styles.tableCol, { width: '6%' }]}>
          <Text style={styles.tableCellHeader}>{day}</Text>
          <Text style={[styles.tableCellHeader, { fontSize: 6 }]}>
            {weekDates[day] ? formatDate(weekDates[day]) : ''}
          </Text>
        </View>
      ))}
      <View style={[styles.tableCol, { width: '7%' }]}>
        <Text style={styles.tableCellHeader}>Bonus</Text>
      </View>
      <View style={[styles.tableColWide, { width: '9%' }]}>
        <Text style={styles.tableCellHeader}>Total</Text>
      </View>
    </View>
  );
};

// Componente del documento PDF
const PayrollPDFDoc = ({ 
  operators, 
  weekInfo, 
  weekDates, 
  week, 
  location,
  paymentStats,
  totalGrand 
}: PayrollPDFExportProps) => {
  const weekdayKeys: (keyof WeekAmounts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const ROWS_PER_PAGE_FIRST = 35; // Primera página (con header y stats)
  const ROWS_PER_PAGE = 45; // Páginas subsiguientes
  
  // Paginar operadores
  let paginatedOperators: OperatorRow[][] = [];
  if (operators.length > ROWS_PER_PAGE_FIRST) {
    paginatedOperators.push(operators.slice(0, ROWS_PER_PAGE_FIRST));
    const remaining = operators.slice(ROWS_PER_PAGE_FIRST);
    const remainingPages = paginateOperators(remaining, ROWS_PER_PAGE);
    paginatedOperators = [...paginatedOperators, ...remainingPages];
  } else {
    paginatedOperators = [operators];
  }
  
  return (
    <PDFDocument>
      {paginatedOperators.map((pageOperators, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {/* Header - solo en la primera página */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Operators Payroll Report</Text>
                <Text style={styles.subtitle}>Week {week} - {location || 'All Locations'}</Text>
                <Text style={styles.periodInfo}>
                  Period: {weekInfo.start_date} to {weekInfo.end_date}
                </Text>
              </View>

              {/* Stats - solo en la primera página */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{operators.length}</Text>
                  <Text style={styles.statLabel}>Total Operators</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#059669' }]}>{paymentStats.paid}</Text>
                  <Text style={styles.statLabel}>Paid</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#dc2626' }]}>{paymentStats.unpaid}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: '#0891b2' }]}>{formatCurrency(totalGrand)}</Text>
                  <Text style={styles.statLabel}>Grand Total</Text>
                </View>
              </View>
            </>
          )}

          {/* Indicador de continuación */}
          {pageIndex > 0 && (
            <Text style={styles.continuedText}>
              (Continued from page {pageIndex})
            </Text>
          )}

          {/* Table Container */}
          <View style={styles.tableContainer}>
            {/* Table Header - en todas las páginas */}
            <TableHeader weekDates={weekDates} />

            {/* Table Body */}
            {pageOperators.map((operator) => (
              <View key={operator.code} style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '4%' }]}>
                  <Text style={styles.tableCell}>
                    {operator.pay != null ? '✓' : '✗'}
                  </Text>
                </View>
                <View style={[styles.tableCol, { width: '7%' }]}>
                  <Text style={styles.tableCellBold}>{operator.code}</Text>
                </View>
                <View style={styles.tableColName}>
                  <Text style={styles.tableCell}>{operator.name}</Text>
                </View>
                <View style={styles.tableColName}>
                  <Text style={styles.tableCell}>{operator.lastName}</Text>
                </View>
                <View style={[styles.tableCol, { width: '8%' }]}>
                  <Text style={styles.tableCell}>{formatCurrency(operator.cost)}</Text>
                </View>
                {weekdayKeys.map(day => (
                  <View key={day} style={[styles.tableCol, { width: '6%' }]}>
                    <Text style={operator[day] ? styles.tableCellGreen : styles.tableCell}>
                      {operator[day] ? formatCurrency(operator[day]) : '—'}
                    </Text>
                  </View>
                ))}
                <View style={[styles.tableCol, { width: '7%' }]}>
                  <Text style={styles.tableCell}>
                    {formatCurrency(operator.additionalBonuses || 0)}
                  </Text>
                </View>
                <View style={[styles.tableColWide, { width: '9%' }]}>
                  <Text style={styles.tableCellBold}>
                    {formatCurrency(operator.grandTotal || 0)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Totals Row - solo en la última página */}
            {pageIndex === paginatedOperators.length - 1 && (
              <View style={[styles.tableRow, styles.totalsRow]}>
                <View style={[styles.tableCol, { width: '4%' }]}><Text></Text></View>
                <View style={[styles.tableCol, { width: '7%' }]}><Text></Text></View>
                <View style={styles.tableColName}><Text></Text></View>
                <View style={styles.tableColName}>
                  <Text style={styles.tableCellBold}>TOTALS</Text>
                </View>
                <View style={[styles.tableCol, { width: '8%' }]}><Text></Text></View>
                {weekdayKeys.map(day => (
                  <View key={day} style={[styles.tableCol, { width: '6%' }]}><Text></Text></View>
                ))}
                <View style={[styles.tableCol, { width: '7%' }]}><Text></Text></View>
                <View style={[styles.tableColWide, { width: '9%' }]}>
                  <Text style={[styles.tableCellBold, { fontSize: 9 }]}>
                    {formatCurrency(totalGrand)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </Text>
          
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} of ${totalPages}`
          )} fixed />
        </Page>
      ))}
    </PDFDocument>
  );
};

// Componente del botón de exportación
const PayrollPDFExport: React.FC<PayrollPDFExportProps> = ({ 
  operators, 
  weekInfo, 
  weekDates, 
  week, 
  location,
  paymentStats,
  totalGrand 
}) => {
  const fileName = `payroll_week_${week}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <PayrollPDFDoc
          operators={operators}
          weekInfo={weekInfo}
          weekDates={weekDates}
          week={week}
          location={location}
          paymentStats={paymentStats}
          totalGrand={totalGrand}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm
            transition-all duration-200 shadow-md hover:shadow-lg
            ${loading 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Export PDF</span>
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default PayrollPDFExport;