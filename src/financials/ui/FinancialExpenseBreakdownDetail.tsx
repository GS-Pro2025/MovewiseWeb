import { Box, Typography, Table, TableBody, TableCell, TableRow, Button } from "@mui/material";
import { exportBreakdownToPDF, exportBreakdownToExcel } from "../util/BreakdownExportUtils";
import { useLocation, useNavigate } from "react-router-dom";

const FinancialExpenseBreakdownDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Recibe los datos por state (o por params)
  const { expenses, income, profit, startWeek, endWeek, year } = location.state || {};

  if (!expenses) return <Typography>No data</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate(-1)}>← Back</Button>
      <Typography variant="h5" sx={{ mb: 2 }}>Expense Breakdown Details</Typography>
      <Table sx={{ maxWidth: 500, mx: "auto", backgroundColor: "#fff", borderRadius: 2, boxShadow: 2 }}>
        <TableBody>
          {Object.entries(expenses).map(([type, value]) => (
            <TableRow key={type}>
              <TableCell>{type}</TableCell>
              <TableCell>${value.toLocaleString()}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell><strong>Income</strong></TableCell>
            <TableCell><strong>${income.toLocaleString()}</strong></TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Profit</strong></TableCell>
            <TableCell><strong>${profit.toLocaleString()}</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button variant="contained" color="primary" onClick={() => exportBreakdownToExcel(expenses, income, profit, startWeek, endWeek, year)}>
          Export to Excel
        </Button>
        <Button variant="contained" color="secondary" onClick={() => exportBreakdownToPDF(expenses, income, profit, startWeek, endWeek, year)}>
          Print / PDF
        </Button>
      </Box>
    </Box>
  );
};

export default FinancialExpenseBreakdownDetail;