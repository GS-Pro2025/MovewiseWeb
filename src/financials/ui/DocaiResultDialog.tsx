/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Box, Typography, Chip, Divider, Button, Alert, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Bot, FileText, CheckCircle, XCircle, Copy } from 'lucide-react';

interface DocaiResultDialogProps {
  open: boolean;
  onClose: () => void;
  result: {
    message: string;
    ocr_text?: string;
    parsed_orders?: Array<{
      OrderNumber: string;
      ShipperName: string;
      CommissionAmount: string;
    }>;
    update_result?: {
      updated_orders?: Array<{
        key_ref: string;
        orders_updated: number;
        expense?: number;
        income?: number;
        key?: string;
        amount_added?: string;
        type?: string;
        new_income?: string;
        new_expense?: string;
      }>;
      not_found_orders?: string[];
      total_updated?: number;
      total_not_found?: number;
      duplicated_orders?: Array<{
        key_ref: string;
        count: number;
        total_amount: string;
        amount_per_order: string;
        type: string;
      }>;
      total_duplicated?: number;
    };
  };
}

const DocaiResultDialog: React.FC<DocaiResultDialogProps> = ({ open, onClose, result }) => {
  if (!open) return null;

  const { message, ocr_text, parsed_orders, update_result } = result;
  const updatedOrders = update_result?.updated_orders ?? [];
  const notFoundOrders = update_result?.not_found_orders ?? [];
  const duplicatedOrders = update_result?.duplicated_orders ?? [];
  const totalUpdated = update_result?.total_updated ?? 0;
  const totalNotFound = update_result?.total_not_found ?? 0;
  const totalDuplicated = update_result?.total_duplicated ?? 0;

  // Helper function para formatear el monto basado en el tipo
  const formatAmount = (order: any) => {
    const amount = parseFloat(order.amount_added || '0');
    if (order.type === 'expense') {
      return amount > 0 ? `-$${Math.abs(amount)}` : `$${Math.abs(amount)}`;
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
          minWidth: 500,
          maxWidth: 800,
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
        </Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          {message}
        </Alert>

        {/* Parsed Orders Section */}
        {parsed_orders && parsed_orders.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={20} />
                  <Typography variant="subtitle1">
                    Extracted Orders ({parsed_orders.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {parsed_orders.map((order, idx) => (
                    <Box key={idx} sx={{ 
                      mb: 1, 
                      p: 2, 
                      border: '1px solid #eee', 
                      borderRadius: 1,
                      backgroundColor: '#f9f9f9'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.OrderNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.ShipperName} - {order.CommissionAmount}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Bot size={20} />
          <Typography variant="subtitle1">Update Summary:</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity={totalNotFound > 0 || totalDuplicated > 0 ? "warning" : "success"} 
            sx={{ mb: 2 }}
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

        {/* Updated Orders con formato mejorado para expenses */}
        {updatedOrders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircle size={18} color="#4caf50" />
              <Typography variant="subtitle2" color="success.main">
                Updated Orders:
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {updatedOrders.map((order, idx) => {
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.key_ref}
                      </Typography>
                      <Box sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        backgroundColor: typeColor,
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {typeText}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1 }}>
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
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${order.new_income}
                          </Typography>
                        </Box>
                      )}
                      
                      {order.new_expense && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            New Expense:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${order.new_expense}
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

        {/* Duplicated Orders Section mejorada */}
        {duplicatedOrders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Copy size={18} color="#ff9800" />
              <Typography variant="subtitle2" color="warning.main">
                Duplicated Orders Detected:
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {duplicatedOrders.map((order, idx) => {
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.key_ref} (x{order.count})
                      </Typography>
                      <Box sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        backgroundColor: typeColor,
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {typeText}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total: {order.total_amount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Per Order: {order.amount_per_order}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

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
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 0.5,
              maxHeight: 120,
              overflow: "auto",
              p: 1,
              border: "1px solid #eee",
              borderRadius: 1,
              backgroundColor: "#fffbe6"
            }}>
              {notFoundOrders.map((order, idx) => (
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

        {/* OCR Text Section */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileText size={20} />
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
          <Button variant="contained" color="primary" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default DocaiResultDialog;