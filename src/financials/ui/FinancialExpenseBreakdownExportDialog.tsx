import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Divider } from "@mui/material";
import { exportBreakdownToExcel, exportBreakdownToPDF } from "../util/BreakdownExportUtils";

interface FinancialExpenseBreakdownExportDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: Record<string, number>;
  income: number;
  profit: number;
  startWeek: number;
  endWeek: number;
  year: number;
}

const FinancialExpenseBreakdownExportDialog: React.FC<FinancialExpenseBreakdownExportDialogProps> = ({
  open,
  onClose,
  expenses,
  income,
  profit,
  startWeek,
  endWeek,
  year
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Export Expense Breakdown</DialogTitle>
    <DialogContent>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Export the current breakdown as Excel or PDF/Print.
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => exportBreakdownToExcel(expenses, income, profit, startWeek, endWeek, year)}
        >
          Export to Excel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => exportBreakdownToPDF(expenses, income, profit, startWeek, endWeek, year)}
        >
          Print / PDF
        </Button>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default FinancialExpenseBreakdownExportDialog;