import { Box, Typography, Table, TableBody, TableCell, TableRow, Button } from "@mui/material";
import { exportBreakdownToPDF, exportBreakdownToExcel } from "../util/BreakdownExportUtils";
import { useLocation, useNavigate } from "react-router-dom";

type BreakdownState = {
  expenses?: Record<string, number | string>;
  income?: number;
  profit?: number;
  startWeek?: number;
  endWeek?: number;
  year?: number;
};

const FinancialExpenseBreakdownDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // tipar el state recibido
  const state = (location.state as BreakdownState) || {};
  const {
    expenses = {},
    income = 0,
    profit = 0,
    startWeek = 0,
    endWeek = 0,
    year = new Date().getFullYear()
  } = state;

  if (!expenses || Object.keys(expenses).length === 0) return <Typography>No data</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate(-1)}>← Back</Button>
      <Typography variant="h5" sx={{ mb: 2 }}>Expense Breakdown Details</Typography>
      <Table sx={{ maxWidth: 500, mx: "auto", backgroundColor: "#fff", borderRadius: 2, boxShadow: 2 }}>
        <TableBody>
          {Object.entries(expenses).map(([type, value]) => {
            const num = Number(value) || 0;
            return (
              <TableRow key={type}>
                <TableCell>{type}</TableCell>
                <TableCell>${num.toLocaleString()}</TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell><strong>Income</strong></TableCell>
            <TableCell><strong>${Number(income).toLocaleString()}</strong></TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Profit</strong></TableCell>
            <TableCell><strong>${Number(profit).toLocaleString()}</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => exportBreakdownToExcel(expenses as Record<string, number>, Number(income), Number(profit), Number(startWeek), Number(endWeek), Number(year))}
        >
          Export to Excel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => exportBreakdownToPDF(expenses as Record<string, number>, Number(income), Number(profit), Number(startWeek), Number(endWeek), Number(year))}
        >
          Print / PDF
        </Button>
      </Box>
    </Box>
  );
};

export default FinancialExpenseBreakdownDetail;