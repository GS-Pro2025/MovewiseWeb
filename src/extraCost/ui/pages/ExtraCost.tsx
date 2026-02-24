/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExtraCostService } from '../../data/ExtraCostService';
import { ExtraCostResponse } from '../../domain/ExtraCostModel';
import { ExtraCostParams } from '../../data/ExtraCostRepository';
import ExtraCostDataTable from '../components/ExtraCostDataTable';

const ExtraCostPage: React.FC = () => {
  const { t } = useTranslation();

  const [extraCosts, setExtraCosts] = useState<ExtraCostResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const extraCostService = useMemo(() => new ExtraCostService(), []);

  const fetchExtraCosts = useCallback(async () => {
    try {
      setIsLoading(true);

      const params: ExtraCostParams = {
        page: page + 1,
        pageSize: rowsPerPage,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await extraCostService.getExtraCosts(params);
      setExtraCosts(response);
    } catch (error) {
      console.error('Error fetching extra costs:', error);
      setExtraCosts(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, extraCostService]);

  useEffect(() => {
    fetchExtraCosts();
  }, [fetchExtraCosts]);

  const totalPages = Math.ceil((extraCosts?.count ?? 0) / rowsPerPage);

  return (
    <div className="container w-full mx-auto p-4">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0B2863' }}>
          {t('extraCostPage.title')}
        </h1>
        <p className="text-gray-600 text-sm">
          {t('extraCostPage.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div
        className="bg-white p-4 rounded-lg border shadow-sm mb-4"
        style={{ borderColor: '#0B2863' }}
      >
        <input
          type="text"
          placeholder={t('extraCostPage.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: '#0B2863', '--tw-ring-color': '#0B2863' } as any}
        />
      </div>

      {/* Table */}
      <ExtraCostDataTable
        data={extraCosts}
        loading={isLoading}
        searchTerm={searchTerm}
      />

      {/* Pagination */}
      {extraCosts && (
        <div className="mt-4">

          {/* Summary */}
          <div
            className="mb-4 p-3 bg-gray-50 border rounded-lg"
            style={{ borderColor: '#0B2863' }}
          >
            <span className="text-sm font-medium" style={{ color: '#0B2863' }}>
              {t('extraCostPage.pagination.summary', {
                count: extraCosts.count,
                page: page + 1,
                total: totalPages,
              })}
            </span>
          </div>

          {/* Controls */}
          <div
            className="flex items-center justify-between bg-white p-4 rounded-lg border"
            style={{ borderColor: '#0B2863' }}
          >
            <div className="flex items-center gap-4">

              {/* Previous */}
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg text-sm font-medium transition-colors"
                style={{
                  borderColor: page === 0 ? '#d1d5db' : '#0B2863',
                  color: page === 0 ? '#d1d5db' : '#0B2863',
                  backgroundColor: page === 0 ? '#f3f4f6' : 'transparent',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {t('extraCostPage.pagination.previous')}
              </button>

              {/* Page Indicator */}
              <span
                className="text-sm font-medium"
                style={{ color: '#0B2863', minWidth: '100px', textAlign: 'center' }}
              >
                {t('extraCostPage.pagination.page', { page: page + 1 })}
              </span>

              {/* Next */}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border rounded-lg text-sm font-medium transition-colors"
                style={{
                  borderColor: page >= totalPages - 1 ? '#d1d5db' : '#0B2863',
                  color: page >= totalPages - 1 ? '#d1d5db' : '#0B2863',
                  backgroundColor: page >= totalPages - 1 ? '#f3f4f6' : 'transparent',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                {t('extraCostPage.pagination.next')}
              </button>
            </div>

            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: '#0B2863' }}>
                {t('extraCostPage.pagination.rowsPerPage')}
              </label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#0B2863', '--tw-ring-color': '#0B2863' } as any}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtraCostPage;