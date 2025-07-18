// components/PayrollExport.tsx
import React from 'react';
import { PayrollExportProps } from '../../models/payrroll';
import ExcelCsvExporter from './PayrollExcelExport';
import PdfExporter from './PayrollPDFExport';

const PayrollExport: React.FC<PayrollExportProps> = (props) => {
  return (
    <div className="flex items-center gap-3">
      {/* Componente para Excel y CSV */}
      <ExcelCsvExporter {...props} />
      
      {/* Componente para PDF */}
      <PdfExporter {...props} />
    </div>
  );
};

export default PayrollExport;