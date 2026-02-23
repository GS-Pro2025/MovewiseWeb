/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import { StatementFilters } from './StatementFilters';
import { StatementToolbar } from './StatementToolbar';
import { StatementDataTable } from './StatementDataTable';
import { fetchStatementsByWeek } from '../data/StatementRepository';
import { StatementRecord, StatementsByWeekResponse, WeekSummary } from '../domain/StatementModels';

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
  return { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] };
};

const StatementsTable: React.FC<{ onVerifyRecords?: (records: StatementRecord[]) => void }> = ({ onVerifyRecords }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<StatementRecord[]>([]);
  const [filteredData, setFilteredData] = useState<StatementRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRows, setSelectedRows] = useState<StatementRecord[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  const [week, setWeek] = useState<number>(() => getWeekOfYear(new Date()));
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const weekRange = useMemo(() => getWeekRange(year, week), [year, week]);

  const handleStateUpdated = (updated: StatementRecord) => {
    setData(prev => prev.map(d => d.id === updated.id ? updated : d));
    setFilteredData(prev => prev.map(d => d.id === updated.id ? updated : d));
    enqueueSnackbar(t('statementsList.stateUpdated', { keyref: updated.keyref, state: updated.state }), { variant: 'success' });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response: StatementsByWeekResponse = await fetchStatementsByWeek(week, year, pagination.pageIndex + 1, pagination.pageSize);
      setData(response.results);
      setWeekSummary(response.week_summary || null);
      setTotalRows(response.count);
    } catch {
      enqueueSnackbar(t('statementsList.errorLoading'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, pagination.pageIndex, pagination.pageSize, week, year, t]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let filtered = [...data];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.keyref && item.keyref.toLowerCase().includes(query)) ||
        (item.shipper_name && item.shipper_name.toLowerCase().includes(query))
      );
    }
    setFilteredData(filtered);
  }, [data, searchQuery]);

  const handleRowSelect = (row: StatementRecord) => {
    setSelectedRows(prev => prev.some(s => s.id === row.id) ? prev.filter(s => s.id !== row.id) : [...prev, row]);
  };

  const handleSelectAll = (selectAll: boolean) => {
    setSelectedRows(selectAll ? [...filteredData] : []);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <StatementFilters
        week={week} year={year} weekRange={weekRange} searchQuery={searchQuery}
        onWeekChange={setWeek} onYearChange={setYear} onSearchQueryChange={setSearchQuery}
        weekSummary={weekSummary} totalRecords={totalRows}
      />
      <StatementToolbar
        data={filteredData} selectedRows={selectedRows}
        onExportExcel={(data, filename) => { console.log('Export Excel:', data, filename); enqueueSnackbar(t('statementsList.exportExcelPending'), { variant: 'info' }); }}
        onExportPDF={(data, filename) => { console.log('Export PDF:', data, filename); enqueueSnackbar(t('statementsList.exportPDFPending'), { variant: 'info' }); }}
        onRefresh={loadData} onVerifyRecords={onVerifyRecords}
      />
      <StatementDataTable
        data={filteredData} loading={loading} page={pagination.pageIndex}
        rowsPerPage={pagination.pageSize} totalRows={totalRows} selectedRows={selectedRows}
        onPageChange={(p) => setPagination(prev => ({ ...prev, pageIndex: p }))}
        onRowsPerPageChange={(rpp) => setPagination({ pageIndex: 0, pageSize: rpp })}
        onRowSelect={handleRowSelect} onSelectAll={handleSelectAll}
        onStateUpdated={handleStateUpdated}
      />
    </Box>
  );
};

export default StatementsTable;