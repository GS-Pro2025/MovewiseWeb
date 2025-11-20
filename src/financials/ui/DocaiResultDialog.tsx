/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Box, Typography, Chip, Divider, Button, Alert, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ChevronDown } from 'lucide-react';
import { Bot, FileText, CheckCircle, XCircle, Copy, AlertTriangle, DollarSign, Layers, Receipt, Truck } from 'lucide-react';
import { OtherTransaction } from '../domain/ModelsOCR';

interface DocaiResultDialogProps {
  open: boolean;
  onClose: () => void;
  result: {
    message: string;
    processing_type?: 'regular_orders_only' | 'other_transactions' | 'mixed';
    other_transactions_page?: number;
    total_pages_scanned?: number;
    ocr_text?: string;
    parsed_orders?: Array<{
      OrderNumber: string;
      ShipperName: string;
      CommissionAmount?: string;
      Amount?: string;
    }>;
    update_result?: any;
    update_summary?: any;
    other_transactions_data?: {
      processing_type: 'other_transactions';
      page_processed: number;
      document_date?: string;
      document_week?: number;
      parsed_transactions?: OtherTransaction[];
      save_summary?: {
        costs_created?: number;
        statements_created?: number;
        skipped_warehouse?: number;
        skipped_no_parentheses?: number;
        skipped_invalid_amount?: number;
        parsing_errors?: number;
        total_processed?: number;
        successfully_processed?: number;
      };
      status: 'completed' | 'failed';
      error?: string;
      text_analyzed_length?: number;
      text_preview?: string;
    };
  };
}

interface ParsedOrder {
  OrderNumber: string;
  ShipperName: string;
  CommissionAmount?: string;
  Amount?: string;
}

interface UpdatedOrder {
  key_ref: string;
  key: string;
  amount_added: string;
  type: string;
  new_income: string;
  new_expense: string;
  factory: string;
  orders_count: number;
}

interface DuplicatedOrder {
  key_ref: string;
  count: number;
  total_amount: string;
  amount_per_order: string;
  type: string;
}

const DocaiResultDialog: React.FC<DocaiResultDialogProps> = ({ open, onClose, result }) => {
  if (!open) return null;

  const { 
    message, 
    processing_type,
    other_transactions_page,
    total_pages_scanned,
    ocr_text, 
    parsed_orders, 
    update_result, 
    update_summary,
    other_transactions_data 
  } = result;
  
  // Usar update_summary si está disponible, sino usar update_result para compatibilidad
  const updateData = update_summary || update_result;
  
  const updatedOrders = updateData?.updated_orders ?? [];
  const notFoundOrders = updateData?.not_found_orders ?? [];
  const duplicatedOrders = updateData?.duplicated_orders ?? [];
  const totalUpdated = updateData?.total_updated ?? 0;
  const totalNotFound = updateData?.total_not_found ?? 0;
  const totalDuplicated = updateData?.total_duplicated ?? 0;

  // Datos de Other Transactions
  const hasOtherTransactions = !!other_transactions_data;
  const otherTransactions = other_transactions_data?.parsed_transactions ?? [];
  const otherTransactionsSummary = other_transactions_data?.save_summary;

  // Helper function para formatear el monto basado en el tipo
  const formatAmount = (order: any) => {
    const amount = parseFloat(order.amount_added || '0');
    if (order.type === 'expense') {
      return amount < 0 ? `$${Math.abs(amount)}` : `-$${Math.abs(amount)}`;
    }
    return `$${Math.abs(amount)}`;
  };

  // Helper function para obtener el color basado en el tipo
  const getTypeColor = (type: string) => {
    return type === 'expense' ? '#ef4444' : '#22c55e';
  };

  // Helper function para obtener el texto del tipo
  const getTypeText = (type: string) => {
    return type === 'expense' ? 'Expense' : 'Income';
  };

  // Helper para determinar si un monto de Other Transaction es gasto
  const isExpenseAmount = (amount: string) => {
    return amount.includes('(') && amount.includes(')');
  };

  // Helper para formatear monto de Other Transaction
  const formatOtherTransactionAmount = (amount: string) => {
    const cleanAmount = amount.replace(/[$,()]/g, '');
    const numericAmount = parseFloat(cleanAmount);
    const isExpense = isExpenseAmount(amount);
    
    return {
      formatted: `$${numericAmount.toLocaleString()}`,
      isExpense,
      color: isExpense ? '#ef4444' : '#22c55e'
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10"
      onClick={onClose}
    >
      <Box
        sx={{
          background: "#fff",
          borderRadius: 3,
          boxShadow: 6,
          p: 4,
          minWidth: 600,
          maxWidth: 900,
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Bot size={24} color="#1976d2" />
          <Typography variant="h6" color="primary">
            AI Document Processing Result
          </Typography>
          {processing_type && (
            <Chip 
              icon={processing_type === 'other_transactions' || processing_type === 'mixed' ? <Layers size={16} /> : <FileText size={16} />}
              label={processing_type.replace('_', ' ').toUpperCase()}
              color={processing_type === 'other_transactions' || processing_type === 'mixed' ? 'secondary' : 'primary'}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          icon={<Bot size={20} />}
        >
          {message}
        </Alert>

        {/* Processing Info */}
        {(total_pages_scanned || other_transactions_page) && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            icon={<Layers size={20} />}
          >
            <Typography variant="body2">
              <strong>Multi-page processing:</strong> 
              {total_pages_scanned && ` ${total_pages_scanned} pages scanned`}
              {other_transactions_page && `, Other Transactions found on page ${other_transactions_page}`}
            </Typography>
          </Alert>
        )}

        {/* Parsed Orders Section */}
        {parsed_orders && parsed_orders.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary 
                expandIcon={<ChevronDown size={20} />}
                sx={{ backgroundColor: '#f8f9fa' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Truck size={20} color="#1976d2" />
                  <Typography variant="subtitle1">
                    Extracted Orders ({parsed_orders.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {parsed_orders.map((order: ParsedOrder, idx: number) => (
                    <Box key={idx} sx={{ 
                      mb: 1, 
                      p: 2, 
                      border: '1px solid #eee', 
                      borderRadius: 1,
                      backgroundColor: '#f9f9f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <DollarSign size={16} color="#666" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.OrderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.ShipperName} - {order.Amount || order.CommissionAmount}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Bot size={20} color="#1976d2" />
          <Typography variant="subtitle1">Regular Orders Update Summary:</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity={totalNotFound > 0 || totalDuplicated > 0 ? "warning" : "success"} 
            sx={{ mb: 2 }}
            icon={totalNotFound > 0 || totalDuplicated > 0 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          >
            <strong>{totalUpdated}</strong> order(s) updated successfully
            {totalNotFound > 0 && (
              <>, <strong>{totalNotFound}</strong> order(s) not found</>
            )}
            {totalDuplicated > 0 && (
              <>, <strong>{totalDuplicated}</strong> duplicated order(s) detected</>
            )}
          </Alert>
        </Box>

        {/* Updated Orders */}
        {updatedOrders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircle size={18} color="#4caf50" />
              <Typography variant="subtitle2" color="success.main">
                Updated Orders:
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {updatedOrders.map((order: UpdatedOrder, idx: number) => {
                const typeColor = getTypeColor(order.type || 'income');
                const typeText = getTypeText(order.type || 'income');
                const formattedAmount = formatAmount(order);
                
                return (
                  <Box key={idx} sx={{ 
                    p: 2, 
                    border: `1px solid ${typeColor}`, 
                    borderRadius: 1,
                    backgroundColor: order.type === 'expense' ? '#fef2f2' : '#f1f8e9'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText size={16} />
                        Order: {order.key_ref}
                      </Typography>
                      <Box sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        backgroundColor: typeColor,
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <DollarSign size={12} />
                        {typeText}
                      </Box>
                    </Box>
                    
                    {order.factory && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        <strong>Client/Company:</strong> {order.factory}
                      </Typography>
                    )}
                    
                    {(order as any).orders_count && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        <strong>Orders Count:</strong> {(order as any).orders_count}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(120px, 1fr))', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Amount Added:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: typeColor }}>
                          {formattedAmount}
                        </Typography>
                      </Box>
                      
                      {order.new_income && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            New Income:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#22c55e' }}>
                            ${parseFloat(order.new_income).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                      
                      {order.new_expense && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            New Expense:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444' }}>
                            ${parseFloat(order.new_expense).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Duplicated Orders */}
        {duplicatedOrders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Copy size={18} color="#ff9800" />
              <Typography variant="subtitle2" color="warning.main">
                Duplicated Orders Detected:
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {duplicatedOrders.map((order: DuplicatedOrder, idx: number) => {
                const typeColor = getTypeColor(order.type);
                const typeText = getTypeText(order.type);
                
                return (
                  <Box key={idx} sx={{ 
                    p: 2, 
                    border: '1px solid #ff9800', 
                    borderRadius: 1,
                    backgroundColor: '#fff3e0'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Copy size={16} />
                        {order.key_ref} (x{order.count})
                      </Typography>
                      <Box sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        backgroundColor: typeColor,
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <DollarSign size={12} />
                        {typeText}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minWidth(100px, 1fr))', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total: ${parseFloat(order.total_amount).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Per Order: ${parseFloat(order.amount_per_order).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Not Found Orders */}
        {notFoundOrders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <XCircle size={18} color="#f44336" />
              <Typography variant="subtitle2" color="warning.main">
                Orders Not Found:
              </Typography>
            </Box>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minWidth(120px, 1fr))",
              gap: 0.5,
              maxHeight: 120,
              overflow: "auto",
              p: 1,
              border: "1px solid #eee",
              borderRadius: 1,
              backgroundColor: "#fffbe6"
            }}>
              {notFoundOrders.map((order: string, idx: number) => (
                <Chip
                  key={idx}
                  label={order}
                  color="warning"
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: "0.8rem" }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Simple Other Transactions Breakdown */}
        {hasOtherTransactions && otherTransactions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Receipt size={18} color="#9c27b0" />
              <Typography variant="subtitle2" color="secondary.main">
                Other Transactions ({otherTransactions.length})
              </Typography>
              {otherTransactionsSummary && (
                <Chip 
                  label={`${otherTransactionsSummary.costs_created || 0} expense records created`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gap: 1, 
              maxHeight: 200, 
              overflow: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              p: 2,
              backgroundColor: '#fafafa'
            }}>
              {otherTransactions.map((transaction: OtherTransaction, idx: number) => {
                const amountInfo = formatOtherTransactionAmount(transaction.Amount);
                
                return (
                  <Box key={idx} sx={{ 
                    p: 2, 
                    border: `1px solid ${amountInfo.color}`, 
                    borderRadius: 1,
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2
                  }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
                        {transaction.DocumentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                        {transaction.ItemDescription === 'undefined' ? 'N/A' : transaction.ItemDescription || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        color: amountInfo.color,
                        minWidth: 'fit-content'
                      }}>
                        {amountInfo.formatted}
                      </Typography>
                      {amountInfo.isExpense && (
                        <Chip
                          label="Expense"
                          size="small"
                          sx={{ 
                            backgroundColor: amountInfo.color,
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* OCR Text Section */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary 
            expandIcon={<ChevronDown size={20} />}
            sx={{ backgroundColor: '#f8f9fa' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileText size={20} color="#1976d2" />
              <Typography variant="subtitle1">Raw OCR Text</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{
              background: "#f9f9f9",
              borderRadius: 2,
              p: 2,
              fontFamily: "monospace",
              fontSize: "0.85rem",
              maxHeight: 200,
              overflow: "auto",
              border: "1px solid #eee"
            }}>
              {ocr_text ? ocr_text : <span style={{ color: "#aaa" }}>No OCR text available.</span>}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onClose}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CheckCircle size={16} />
            Close
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default DocaiResultDialog;