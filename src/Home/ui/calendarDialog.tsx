import React, { useMemo, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { fetchOrdersCountPerDay } from "../data/repositoryOrders";

// Utilidad para obtener los días del mes
function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// Define los 5 estados de azul según el número de órdenes
const blueShades = [
  "#e3f2fd", // 0 ordenes
  "#90caf9", // 1-2 ordenes
  "#42a5f5", // 3-4 ordenes
  "#1976d2", // 5-7 ordenes
  "#0d47a1", // 8+ ordenes
];

// Devuelve el color según el número de órdenes
function getDayColor(orderCount: number) {
  if (orderCount === 0) return blueShades[0];
  if (orderCount <= 2) return blueShades[1];
  if (orderCount <= 4) return blueShades[2];
  if (orderCount <= 7) return blueShades[3];
  return blueShades[4];
}

interface OrdersCalendarDialogProps {
  open: boolean;
  onClose: () => void;
  initialMonth?: Date;
  onDaySelect?: (date: Date) => void; 
}

const OrdersCalendarDialog: React.FC<OrdersCalendarDialogProps> = ({
  open,
  onClose,
  initialMonth,
  onDaySelect,
}) => {
  const [month, setMonth] = useState<Date>(initialMonth || new Date());
  const [ordersByDate, setOrdersByDate] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Cargar conteo de órdenes al cambiar mes
  useEffect(() => {
    const year = month.getFullYear();
    const monthNum = month.getMonth() + 1; // JS: 0-indexed
    setLoading(true);
    fetchOrdersCountPerDay(year, monthNum).then((result) => {
      if (result.success && result.data) {
        // Convierte el array a un objeto { "YYYY-MM-DD": count }
        const map: Record<string, number> = {};
        result.data.data.forEach((item) => {
          map[item.date] = item.count;
        });
        setOrdersByDate(map);
      } else {
        setOrdersByDate({});
      }
      setLoading(false);
    });
  }, [month]);

  // Días del mes actual
  const days = useMemo(
    () => getDaysInMonth(month.getFullYear(), month.getMonth()),
    [month]
  );

  // Día de la semana en que inicia el mes (0=domingo)
  const firstDayOfWeek = days[0].getDay();

  // Nombres de los días
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Handler para click en día (lo dejas en handlep)
 // const handleDayClick = () => {
    // TODO: Implementar lógica para manejar el click en un día
  //};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <IconButton onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6">
            {month.toLocaleString("default", { month: "long", year: "numeric" })}
          </Typography>
          <IconButton onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1} mb={2}>
              {weekDays.map((wd) => (
                <Typography key={wd} align="center" fontWeight="bold">
                  {wd}
                </Typography>
              ))}
            </Box>
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
              {/* Espacios vacíos antes del primer día */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <Box key={`empty-${idx}`} />
              ))}
              {days.map((date) => {
                const dateStr = date.toISOString().slice(0, 10);
                const orderCount = ordersByDate[dateStr] || 0;
                return (
                  <Button
                    key={dateStr}
                    variant="contained"
                    onClick={() => {
                      if (onDaySelect) onDaySelect(date);
                    }}
                    sx={{
                      backgroundColor: getDayColor(orderCount),
                      color: orderCount > 4 ? "#fff" : "#222",
                      minWidth: 0,
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      fontWeight: "bold",
                      fontSize: 16,
                      p: 0,
                      m: "auto",
                      boxShadow: orderCount > 0 ? 2 : 0,
                      transition: "background 0.2s",
                      "&:hover": {
                        backgroundColor: getDayColor(orderCount + 1),
                      },
                    }}
                    title={
                      orderCount > 0
                        ? `${orderCount} order${orderCount > 1 ? "s" : ""}`
                        : "No orders"
                    }
                  >
                    {date.getDate()}
                  </Button>
                );
              })}
            </Box>
            <Box mt={3}>
              <Typography variant="body2" color="text.secondary">
                Click a day to see its orders. The more blue, the more orders.
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                {blueShades.map((color) => (
                  <Box
                    key={color}
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: color,
                      borderRadius: "50%",
                      border: "1px solid #ccc",
                      mr: 1,
                    }}
                  />
                ))}
                <Typography variant="caption" color="text.secondary">
                  0, 1-2, 3-4, 5-7, 8+ orders
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrdersCalendarDialog;