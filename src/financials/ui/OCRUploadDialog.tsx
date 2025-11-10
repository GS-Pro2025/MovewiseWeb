/* eslint-disable @typescript-eslint/no-explicit-any */
// components/OCRUploadDialog.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import { CheckCircle, X, AlertTriangle, Info, Upload, FileText, Calendar } from 'lucide-react';
import { OCRResult } from '../domain/ModelsOCR';
import { ProcessMode } from '../data/repositoryDOCAI';
import LoaderSpinner from '../../components/Login_Register/LoadingSpinner';
import WeekYearPicker from '../../components/WeekYearPicker';

interface OCRUploadDialogProps {
  open: boolean;
  loading: boolean;
  step: string;
  files: File[];
  results: OCRResult[];
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  onUpload: (processMode: ProcessMode, week: number, year: number) => void;
  onProcessMore: () => void;
  onViewDetails?: () => void;
  hasDetailedResults?: boolean;
  currentWeek: number;
  currentYear: number;
}

const OCRUploadDialog: React.FC<OCRUploadDialogProps> = ({
  open,
  loading,
  step,
  files,
  results,
  onClose,
  onFilesSelected,
  onUpload,
  onProcessMore,
  onViewDetails,
  hasDetailedResults,
  currentWeek,
  currentYear
}) => {
  const [processMode, setProcessMode] = useState<ProcessMode>('full_process');
  const [selectedWeek, setSelectedWeek] = useState({ week: currentWeek, year: currentYear });

  // Full Screen Loader Component
  const FullScreenLoader = ({ text }: { text: string }) => (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2000,
        background: "rgba(255,255,255,0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoaderSpinner />
      <Typography variant="h6" sx={{ mt: 4, color: "#0458AB" }}>
        {text}
      </Typography>
    </Box>
  );

  // Process mode info component
  const ProcessModeInfo = () => (
    <Card sx={{ mb: 3, backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info size={18} color="#0458AB" />
            Processing Mode
          </Typography>
          <Tooltip title={
            processMode === 'full_process' 
              ? "Save statements AND update order income/expenses"
              : "Only save statement records without updating orders"
          }>
            <FormControlLabel
              control={
                <Switch
                  checked={processMode === 'full_process'}
                  onChange={(e) => setProcessMode(e.target.checked ? 'full_process' : 'save_only')}
                  color="primary"
                  size="small"
                />
              }
              label={processMode === 'full_process' ? 'Full Process' : 'Save Only'}
              sx={{ margin: 0 }}
            />
          </Tooltip>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {processMode === 'full_process' 
            ? "📊 Will save statement records AND update order income/expenses"
            : "💾 Will only save statement records without modifying existing orders"
          }
        </Typography>
      </CardContent>
    </Card>
  );

  // Week Selection Component
  const WeekSelectionInfo = () => (
    <Card sx={{ mb: 3, backgroundColor: '#f0f8ff', border: '1px solid #cce7ff' }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={18} color="#1976d2" />
            Week & Year Selection
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Select the target week and year for processing the statements
        </Typography>
        <WeekYearPicker
          value={selectedWeek}
          onChange={setSelectedWeek}
          label="Target Week & Year"
          size="small"
        />
      </CardContent>
    </Card>
  );

  // Calculate results summary
  const getResultsSummary = () => {
    let totalUpdated = 0;
    let totalNotFound = 0;
    let totalSaved = 0;
    const allNotFoundOrders: string[] = [];
    const allUpdatedOrders: Array<{ key_ref: string; income: number; orders_updated: number }> = [];

    results.forEach(result => {
      if (result.success && result.data) {
        // Full process mode
        if (result.data.total_updated !== undefined) {
          totalUpdated += result.data.total_updated || 0;
          totalNotFound += result.data.total_not_found || 0;
          
          if (result.data.not_found_orders) {
            allNotFoundOrders.push(...result.data.not_found_orders);
          }
          
          if (result.data.updated_orders) {
            allUpdatedOrders.push(...result.data.updated_orders);
          }
        }
        // Save only mode
        else if (result.processMode === 'save_only') {
          totalSaved += result.data.statement_records_created || 0;
        }
      }
    });

    return {
      totalUpdated,
      totalNotFound,
      totalSaved,
      allNotFoundOrders,
      allUpdatedOrders,
    };
  };

  const PrimaryButton = ({ 
    onClick, 
    disabled, 
    children 
  }: { 
    onClick: () => void, 
    disabled?: boolean, 
    children: React.ReactNode 
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 min-h-[50px] px-6 py-3 rounded-xl text-white font-semibold text-sm 
        bg-gradient-to-br from-indigo-500 to-purple-600 
        shadow-lg hover:shadow-xl transition-all duration-300 
        hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed 
        disabled:transform-none flex items-center justify-center gap-2`}
    >
      {children}
    </button>
  );

  const SecondaryButton = ({ 
    onClick, 
    disabled, 
    children,
    style
  }: { 
    onClick: () => void, 
    disabled?: boolean, 
    children: React.ReactNode,
    style?: React.CSSProperties
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`px-6 py-3 rounded-xl border-2 border-indigo-500 text-indigo-500 
        font-semibold text-sm bg-transparent hover:bg-indigo-50 
        shadow-md hover:shadow-lg transition-all duration-300 
        hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed 
        disabled:transform-none min-w-[100px]`}
    >
      {children}
    </button>
  );

  if (!open) return null;

  if (loading) {
    return <FullScreenLoader text={step} />;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          background: "#fff",
          borderRadius: 4,
          boxShadow: 8,
          p: 4,
          minWidth: 400,
          maxWidth: 700,
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <Typography variant="h5" mb={3} sx={{ fontWeight: 600, color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Upload size={24} />
          Upload Statement PDFs (OCR)
        </Typography>
        
        {results.length === 0 ? (
          // File Selection Phase
          <>
            <ProcessModeInfo />
            <WeekSelectionInfo />
            
            <input
              id="ocr-upload-input"
              type="file"
              accept="application/pdf"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []);
                onFilesSelected(selectedFiles.slice(0, 10));
              }}
              disabled={loading}
            />
            <label htmlFor="ocr-upload-input">
              <Box
                sx={{
                  width: '100%',
                  minHeight: 60,
                  px: 3,
                  py: 2,
                  mb: 3,
                  borderRadius: 3,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50',
                    transform: 'translateY(-2px)',
                  }
                }}
                component="span"
              >
                <FileText size={24} color="#667eea" />
                <Typography variant="body1" color="primary" fontWeight="semibold">
                  {files.length > 0
                    ? `📁 ${files.length} file(s) selected`
                    : "📁 Select PDF files (max 10)"}
                </Typography>
              </Box>
            </label>
            
            <Box sx={{ mb: 3, maxHeight: 200, overflow: 'auto' }}>
              {files.map((file, idx) => (
                <Card key={file.name + idx} sx={{ mb: 1, p: 2 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    📄 {file.name}
                    <Chip 
                      label={`${(file.size / 1024 / 1024).toFixed(1)} MB`}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Typography>
                </Card>
              ))}
            </Box>
            
            <div className="flex gap-2 mt-2">
              <PrimaryButton
                disabled={files.length === 0 || loading}
                onClick={() => onUpload(processMode, selectedWeek.week, selectedWeek.year)}
              >
                {loading ? "🔄 Processing..." : `🚀 ${processMode === 'full_process' ? 'Process & Update' : 'Save Only'}`}
              </PrimaryButton>
              <SecondaryButton
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </SecondaryButton>
            </div>
          </>
        ) : (
          // Results Phase
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" mb={2} sx={{ color: '#667eea', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle size={20} />
                Processing Results
              </Typography>
              
              {(() => {
                const summary = getResultsSummary();
                const hasFullProcessResults = summary.totalUpdated > 0 || summary.totalNotFound > 0;
                const hasSaveOnlyResults = summary.totalSaved > 0;
                
                return (
                  <Box sx={{ mb: 2 }}>
                    <Alert 
                      severity={
                        hasFullProcessResults && summary.totalNotFound > 0 ? "warning" : 
                        hasFullProcessResults || hasSaveOnlyResults ? "success" : "info"
                      } 
                      sx={{ mb: 2, borderRadius: 3 }}
                      icon={
                        hasFullProcessResults && summary.totalNotFound > 0 ? <AlertTriangle size={20} /> : 
                        <CheckCircle size={20} />
                      }
                    >
                      <Typography variant="body2">
                        <strong>Summary for Week {selectedWeek.week}, {selectedWeek.year}:</strong> 
                        {hasFullProcessResults && (
                          <> {summary.totalUpdated} orders updated successfully</>
                        )}
                        {hasSaveOnlyResults && (
                          <> {summary.totalSaved} statement records saved</>
                        )}
                        {hasFullProcessResults && summary.totalNotFound > 0 && (
                          <>, {summary.totalNotFound} orders not found in the system</>
                        )}
                      </Typography>
                    </Alert>
                    
                    {/* Updated Orders Summary */}
                    {summary.totalUpdated > 0 && (
                      <Card sx={{ mb: 3, borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                            <CheckCircle size={18} style={{ marginRight: 8 }} />
                            ✅ Updated Orders ({summary.totalUpdated}):
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {summary.allUpdatedOrders.map((order, idx) => (
                              <Chip 
                                key={idx} 
                                label={`${order.key_ref} ($${order.income.toLocaleString()})`}
                                size="small" 
                                color="success" 
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Not Found Orders Summary */}
                    {summary.totalNotFound > 0 && (
                      <Card sx={{ mb: 3, borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                            <AlertTriangle size={18} style={{ marginRight: 8 }} />
                            ⚠️ Orders Not Found in System ({summary.totalNotFound}):
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                            These orders were found in the PDFs but don't exist in the system.
                          </Typography>
                          <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                            gap: 0.5,
                            maxHeight: 200,
                            overflow: 'auto',
                            p: 2,
                            backgroundColor: 'grey.50',
                            borderRadius: 2
                          }}>
                            {summary.allNotFoundOrders.map((order, idx) => (
                              <Chip 
                                key={idx} 
                                label={order} 
                                size="small" 
                                color="warning" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', borderRadius: 2 }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                );
              })()}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Detailed Results */}
            <Typography variant="subtitle1" mb={2} sx={{ fontWeight: 600, color: '#667eea' }}>
              📋 File Processing Details:
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {results.map((result, idx) => (
                <Card key={idx} sx={{ mb: 2, borderRadius: 3, border: result.success ? '2px solid #4caf50' : '2px solid #f44336' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {result.success ? (
                        <CheckCircle size={20} color="#4caf50" style={{ marginRight: 8 }} />
                      ) : (
                        <X size={20} color="#f44336" style={{ marginRight: 8 }} />
                      )}
                      <Typography variant="body1" fontWeight="bold">
                        {result.name}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {result.message}
                    </Typography>
                    
                    {result.success && result.data && (
                      <Box sx={{ ml: 3 }}>
                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                          ✅ {result.data.total_updated || 0} orders updated
                        </Typography>
                        {(result.data.total_not_found || 0) > 0 && (
                          <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontWeight: 600 }}>
                            ⚠️ {result.data.total_not_found || 0} orders not found
                          </Typography>
                        )}
                        
                        {/* Show updated orders for this file */}
                        {result.data.updated_orders && result.data.updated_orders.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Updated:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {result.data.updated_orders.map((order: any, orderIdx: number) => (
                                <Chip 
                                  key={orderIdx}
                                  label={`${order.key_ref} ($${order.income})`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontSize: '0.65rem', height: 20, borderRadius: 2 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Show not found orders for this file */}
                        {result.data.not_found_orders && result.data.not_found_orders.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Not found:
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 0.3, 
                              mt: 0.5,
                              maxHeight: 60,
                              overflow: 'auto'
                            }}>
                              {result.data.not_found_orders.slice(0, 10).map((order: string, orderIdx: number) => (
                                <Chip 
                                  key={orderIdx}
                                  label={order}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ fontSize: '0.6rem', height: 18, borderRadius: 2 }}
                                />
                              ))}
                              {result.data.not_found_orders.length > 10 && (
                                <Chip 
                                  label={`+${result.data.not_found_orders.length - 10} more`}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ fontSize: '0.6rem', height: 18, borderRadius: 2 }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>

            <div className="flex gap-2 mt-3">
              <PrimaryButton onClick={onClose}>
                ✅ Done
              </PrimaryButton>
              
              {/* Botón para ver detalles detallados - solo si hay resultados */}
              {hasDetailedResults && onViewDetails && (
                <SecondaryButton
                  onClick={onViewDetails}
                  style={{ minWidth: '150px' }}
                >
                  🔍 View Detailed Results
                </SecondaryButton>
              )}
              
              <SecondaryButton
                onClick={onProcessMore}
                style={{ minWidth: '150px' }}
              >
                🔄 Process More Files
              </SecondaryButton>
            </div>
          </>
        )}
      </Box>
    </Box>
  );
};

export default OCRUploadDialog;