import React from "react";
import { Box, Typography, Chip, Divider, Button, Alert } from "@mui/material";

interface DocaiResultDialogProps {
  open: boolean;
  onClose: () => void;
  result: {
    message: string;
    ocr_text?: string;
    update_result?: {
      updated_orders?: Array<{
        key_ref: string;
        orders_updated: number;
        expense?: number;
        income?: number;
      }>;
      not_found_orders?: string[];
      total_updated?: number;
      total_not_found?: number;
    };
  };
}

const DocaiResultDialog: React.FC<DocaiResultDialogProps> = ({ open, onClose, result }) => {
  if (!open) return null;

  const { message, ocr_text, update_result } = result;
  const updatedOrders = update_result?.updated_orders ?? [];
  const notFoundOrders = update_result?.not_found_orders ?? [];
  const totalUpdated = update_result?.total_updated ?? 0;
  const totalNotFound = update_result?.total_not_found ?? 0;

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
          minWidth: 400,
          maxWidth: 700,
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <Typography variant="h6" mb={2} color="primary">
          DOCAi Statement Result
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          {message}
        </Alert>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" mb={1}>OCR Extracted Text:</Typography>
        <Box sx={{
          background: "#f9f9f9",
          borderRadius: 2,
          p: 2,
          fontFamily: "monospace",
          fontSize: "0.95rem",
          maxHeight: 200,
          overflow: "auto",
          mb: 2,
          border: "1px solid #eee"
        }}>
          {ocr_text ? ocr_text : <span style={{ color: "#aaa" }}>No OCR text available.</span>}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" mb={1}>Update Summary:</Typography>
        <Box sx={{ mb: 2 }}>
          <Alert severity={totalNotFound > 0 ? "warning" : "success"} sx={{ mb: 2 }}>
            <strong>{totalUpdated}</strong> order(s) updated successfully
            {totalNotFound > 0 && (
              <>,&nbsp;<strong>{totalNotFound}</strong> order(s) not found in the system</>
            )}
          </Alert>
        </Box>

        {updatedOrders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
              Updated Orders:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {updatedOrders.map((order, idx) => (
                <Chip
                  key={idx}
                  label={`${order.key_ref} (${order.orders_updated} upd${order.income ? `, $${order.income}` : ""})`}
                  color="success"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {notFoundOrders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
              Orders Not Found:
            </Typography>
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