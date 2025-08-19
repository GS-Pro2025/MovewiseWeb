/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { SuperOrder } from '../domain/SuperOrderModel';
import { getOperatorsByKeyRef } from '../data/OperatorsRepository';

interface OperatorParticipation {
  operatorId: number;
  operatorCode: string;
  operatorName: string;
  totalDays: number;
  orders: string[];
  roles: string[];
  assignedDates: string[];
}

interface SuperOrderDetailsDialogProps {
  open: boolean;
  superOrder: SuperOrder | null;
  onClose: () => void;
}

const SuperOrderDetailsDialog: React.FC<SuperOrderDetailsDialogProps> = ({
  open,
  superOrder,
  onClose,
}) => {
  const [operators, setOperators] = useState<OperatorParticipation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && superOrder) {
      fetchOperators();
    }
  }, [open, superOrder]);

  const fetchOperators = async () => {
    if (!superOrder) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getOperatorsByKeyRef(superOrder.key_ref);
      if (response.success) {
        setOperators(consolidateOperators(response.data));
      } else {
        setError(response.errorMessage || 'Error loading operators');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading operators');
    } finally {
      setLoading(false);
    }
  };

  const consolidateOperators = (data: any): OperatorParticipation[] => {
    const operatorMap = new Map<number, OperatorParticipation>();
    
    // data contiene key_ref y orders
    if (data && data.orders) {
      data.orders.forEach((order: any) => {
        order.operators.forEach((operator: any) => {
          if (!operatorMap.has(operator.id_operator)) {
            operatorMap.set(operator.id_operator, {
              operatorId: operator.id_operator,
              operatorCode: operator.code,
              operatorName: `${operator.first_name} ${operator.last_name}`,
              totalDays: 0,
              orders: [],
              roles: [],
              assignedDates: [],
            });
          }
          
          const consolidatedOperator = operatorMap.get(operator.id_operator)!;
          consolidatedOperator.totalDays += 1;
          
          if (!consolidatedOperator.orders.includes(order.order_key)) {
            consolidatedOperator.orders.push(order.order_key);
          }
          
          if (!consolidatedOperator.roles.includes(operator.rol)) {
            consolidatedOperator.roles.push(operator.rol);
          }
          
          if (!consolidatedOperator.assignedDates.includes(operator.assigned_at)) {
            consolidatedOperator.assignedDates.push(operator.assigned_at);
          }
        });
      });
    }
    
    return Array.from(operatorMap.values());
  };

  const getUniqueValues = (field: string) => {
    if (!superOrder) return [];
    return [...new Set(superOrder.orders.map((order: any) => order[field]))].filter(Boolean);
  };

  const getTotalWeight = () => {
    if (!superOrder) return 0;
    return superOrder.orders.reduce((total, order) => total + (order.weight || 0), 0);
  };

  const getDateRange = () => {
    if (!superOrder || !superOrder.orders.length) return '';
    
    const dates = superOrder.orders.map(order => new Date(order.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
  };

  if (!superOrder) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Super Order Details: {superOrder.key_ref}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* General Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            General Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Client</Typography>
              <Typography variant="body1" fontWeight="medium">{superOrder.client}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Total Orders</Typography>
              <Typography variant="body1" fontWeight="medium">{superOrder.orders.length}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Total Weight</Typography>
              <Typography variant="body1" fontWeight="medium">{getTotalWeight().toLocaleString()} lbs</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Total Income</Typography>
              <Typography variant="body1" fontWeight="medium" color="success.main">
                ${superOrder.totalIncome.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Total Profit</Typography>
              <Typography 
                variant="body1" 
                fontWeight="medium" 
                color={superOrder.totalProfit >= 0 ? "success.main" : "error.main"}
              >
                ${superOrder.totalProfit.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Payment Status</Typography>
              <Chip
                label={superOrder.payStatus === 1 ? "Paid" : "Unpaid"}
                size="small"
                color={superOrder.payStatus === 1 ? "success" : "warning"}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Locations */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>Locations</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getUniqueValues('state').map((location, index) => (
                <Chip key={index} label={location} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>

          {/* Job Types */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>Job Types</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getUniqueValues('job').map((job, index) => (
                <Chip key={index} label={job} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
          </Box>

          {/* Date Range */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>Date Range</Typography>
            <Typography variant="body2">
              {getDateRange()}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Operators Section */}
        <Box>
          <Typography variant="h6" gutterBottom color="primary">
            Participating Operators ({operators.length})
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ py: 2 }}>
              {error}
            </Typography>
          ) : operators.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
              No operators found for this super order.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Operator</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Total Days</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Orders</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Roles</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Work Dates</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {operators.map((operator) => (
                    <TableRow key={operator.operatorId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {operator.operatorName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {operator.operatorCode} (ID: {operator.operatorId})
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={operator.totalDays} 
                          size="small" 
                          color={operator.totalDays > 3 ? "success" : operator.totalDays > 1 ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {operator.orders.length}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {operator.roles.map((role, index) => (
                            <Chip 
                              key={index} 
                              label={role} 
                              size="small" 
                              variant="outlined"
                              color="secondary"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {operator.assignedDates.map((date, index) => (
                            <Chip 
                              key={index} 
                              label={new Date(date).toLocaleDateString()}
                              size="small" 
                              variant="outlined"
                              color="info"
                            />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Individual Orders Summary */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Individual Orders ({superOrder.orders.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Job</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Weight</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Income</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {superOrder.orders.map((order) => (
                  <TableRow key={order.key} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {order.key.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.state}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.job}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {order.weight?.toLocaleString() || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main" fontWeight="medium">
                        ${order.income?.toLocaleString() || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.payStatus === 1 ? "Paid" : "Unpaid"}
                        size="small"
                        color={order.payStatus === 1 ? "success" : "warning"}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SuperOrderDetailsDialog;