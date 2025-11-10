/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import { useSnackbar } from 'notistack';

// Components
import { StatementFilters } from './StatementFilters';
import { StatementToolbar } from './StatementToolbar';
import { StatementDataTable } from './StatementDataTable';

// Services
import { fetchStatementsByWeek } from '../data/StatementRepository';

// Types
import { StatementRecord, WeekSummary, StatementsByWeekResponse } from '../domain/statementModels';

// Utils
const getWeekOfYear = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getWeekRange = (year: number, week: number): { start: string; end: string } => {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
  const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
  const endDate = new Date(startDate.getTime() + 6 * 86400000);
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
};

const StatementsTable: React.FC = () => {
  // State
  const [data, setData] = useState<StatementRecord[]>([]);
  const [filteredData, setFilteredData] = useState<StatementRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRows, setSelectedRows] = useState<StatementRecord[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    return getWeekOfYear(now);
  });
  
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [totalRows, setTotalRows] = useState(0);
  
  const weekRange = useMemo(() => getWeekRange(year, week), [year, week]);
  
  // Filters
  const [stateFilter, setStateFilter] = useState<string>('');
  const [shipperFilter, setShipperFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');

  // Hooks
  const { enqueueSnackbar } = useSnackbar();

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response: StatementsByWeekResponse = await fetchStatementsByWeek(
        week,
        year,
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      
      setData(response.results);
      setWeekSummary(response.week_summary || null);
      setTotalRows(response.count);
      
    } catch (error) {
      console.error('Error loading statements:', error);
      enqueueSnackbar('Error loading statements', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pagination, week, year]);

  // Effects
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter data based on local filters
  useEffect(() => {
    let filtered = [...data];
    
    if (stateFilter) {
      filtered = filtered.filter((item) => 
        item.state && item.state.toLowerCase().includes(stateFilter.toLowerCase())
      );
    }
    
    if (shipperFilter) {
      filtered = filtered.filter((item) => 
        item.shipper_name && item.shipper_name.toLowerCase().includes(shipperFilter.toLowerCase())
      );
    }
    
    if (companyFilter) {
      filtered = filtered.filter((item) => 
        item.company && item.company.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [data, stateFilter, shipperFilter, companyFilter]);

  // Event handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, pageIndex: newPage }));
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setPagination({ pageIndex: 0, pageSize: newRowsPerPage });
  };

  const handleRowSelect = (row: StatementRecord) => {
    setSelectedRows(prev => {
      const isSelected = prev.some(selected => selected.id === row.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== row.id);
      } else {
        return [...prev, row];
      }
    });
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedRows([...filteredData]);
    } else {
      setSelectedRows([]);
    }
  };

  // Export handlers
  const handleExportExcel = (data: StatementRecord[], filename: string) => {
    // Implementar exportación a Excel
    console.log('Export Excel:', data, filename);
    enqueueSnackbar('Export to Excel functionality to be implemented', { variant: 'info' });
  };

  const handleExportPDF = (data: StatementRecord[], filename: string) => {
    // Implementar exportación a PDF
    console.log('Export PDF:', data, filename);
    enqueueSnackbar('Export to PDF functionality to be implemented', { variant: 'info' });
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Filters with Statistics */}
      <StatementFilters
        week={week}
        year={year}
        weekRange={weekRange}
        stateFilter={stateFilter}
        shipperFilter={shipperFilter}
        companyFilter={companyFilter}
        onWeekChange={setWeek}
        onYearChange={setYear}
        onStateFilterChange={setStateFilter}
        onShipperFilterChange={setShipperFilter}
        onCompanyFilterChange={setCompanyFilter}
        weekSummary={weekSummary}
        totalRecords={totalRows}
      />

      {/* Toolbar */}
      <StatementToolbar
        data={filteredData}
        selectedRows={selectedRows}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onRefresh={loadData}
      />

      {/* Data Table */}
      <StatementDataTable
        data={filteredData}
        loading={loading}
        page={pagination.pageIndex}
        rowsPerPage={pagination.pageSize}
        totalRows={totalRows}
        selectedRows={selectedRows}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
      />
    </Box>
  );
};

export default StatementsTable;