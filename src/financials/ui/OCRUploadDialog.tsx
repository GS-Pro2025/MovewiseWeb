// components/OCRUploadDialog.tsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { OCRResult } from '../domain/ModelsOCR';
import LoaderSpinner from '../../componets/Login_Register/LoadingSpinner';

interface OCRUploadDialogProps {
  open: boolean;
  loading: boolean;
  step: string;
  files: File[];
  results: OCRResult[];
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  onUpload: () => void;
  onProcessMore: () => void;
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
  onProcessMore
}) => {
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

  // Calculate results summary
  const getResultsSummary = () => {
    let totalUpdated = 0;
    let totalNotFound = 0;
    const allNotFoundOrders: string[] = [];
    const allUpdatedOrders: Array<{ key_ref: string; income: number; orders_updated: number }> = [];

    results.forEach(result => {
      if (result.success && result.data) {
        totalUpdated += result.data.total_updated || 0;
        totalNotFound += result.data.total_not_found || 0;
        
        if (result.data.not_found_orders) {
          allNotFoundOrders.push(...result.data.not_found_orders);
        }
        
        if (result.data.updated_orders) {
          allUpdatedOrders.push(...result.data.updated_orders);
        }
      }
    });

    return {
      totalUpdated,
      totalNotFound,
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

  const OutlinedButton = ({ 
    onClick, 
    disabled, 
    children,
    as = 'button'
  }: { 
    onClick?: () => void, 
    disabled?: boolean, 
    children: React.ReactNode,
    as?: 'button' | 'span'
  }) => {
    const className = `w-full min-h-[60px] px-6 py-3 mb-6 rounded-xl border-2 border-gray-200 
      text-indigo-500 font-semibold bg-transparent hover:border-indigo-500 
      hover:bg-indigo-50 shadow-md hover:shadow-lg transition-all duration-300 
      hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed 
      disabled:transform-none flex items-center justify-center gap-2`;

    if (as === 'span') {
      return (
        <span className={className}>
          {children}
        </span>
      );
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={className}
      >
        {children}
      </button>
    );
  };

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
        <Typography variant="h5" mb={3} sx={{ fontWeight: 600, color: '#667eea' }}>
          📄 Upload Statement PDFs (OCR)
        </Typography>
        
        {results.length === 0 ? (
          // File Selection Phase
          <>
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
              <OutlinedButton
                as="span"
                disabled={loading || files.length >= 10}
              >
                {files.length > 0
                  ? `📁 ${files.length} file(s) selected`
                  : "📁 Select PDF files (max 10)"}
              </OutlinedButton>
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
                onClick={onUpload}
              >
                {loading ? "🔄 Processing..." : "🚀 Process Files"}
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
              <Typography variant="h6" mb={2} sx={{ color: '#667eea', fontWeight: 600 }}>
                📊 Processing Results
              </Typography>
              
              {(() => {
                const summary = getResultsSummary();
                return (
                  <Box sx={{ mb: 2 }}>
                    <Alert 
                      severity={summary.totalNotFound > 0 ? "warning" : "success"} 
                      sx={{ mb: 2, borderRadius: 3 }}
                    >
                      <Typography variant="body2">
                        <strong>Summary:</strong> {summary.totalUpdated} orders updated successfully
                        {summary.totalNotFound > 0 && `, ${summary.totalNotFound} orders not found in the system`}
                      </Typography>
                    </Alert>
                    
                    {summary.totalUpdated > 0 && (
                      <Card sx={{ mb: 3, borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                            <CheckCircleIcon sx={{ mr: 1, fontSize: 18 }} />
                            ✅ Updated Orders ({summary.totalUpdated}):
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {summary.allUpdatedOrders.map((order, idx) => (
                              <Chip 
                                key={idx} 
                                label={`${order.key_ref} (${order.income.toLocaleString()})`}
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
                    
                    {summary.totalNotFound > 0 && (
                      <Card sx={{ mb: 3, borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                            <WarningIcon sx={{ mr: 1, fontSize: 18 }} />
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
                        <CheckCircleIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                      ) : (
                        <ErrorIcon sx={{ color: 'error.main', mr: 1, fontSize: 20 }} />
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
                              {result.data.updated_orders.map((order, orderIdx) => (
                                <Chip 
                                  key={orderIdx}
                                  label={`${order.key_ref} (${order.income})`}
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
                              {result.data.not_found_orders.slice(0, 10).map((order, orderIdx) => (
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