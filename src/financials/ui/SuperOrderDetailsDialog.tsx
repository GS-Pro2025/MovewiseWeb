/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
} from "@mui/material";
import { SuperOrder } from "../domain/SuperOrderModel";
import { getOperatorsByKeyRef } from "../data/OperatorsRepository";

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
        setError(response.errorMessage || "Error loading operators");
      }
    } catch (err: any) {
      setError(err.message || "Error loading operators");
    } finally {
      setLoading(false);
    }
  };

  const consolidateOperators = (data: any): OperatorParticipation[] => {
    const operatorMap = new Map<number, OperatorParticipation>();

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

          if (
            !consolidatedOperator.assignedDates.includes(operator.assigned_at)
          ) {
            consolidatedOperator.assignedDates.push(operator.assigned_at);
          }
        });
      });
    }

    return Array.from(operatorMap.values());
  };

  const getUniqueValues = (field: string) => {
    if (!superOrder) return [];
    return [
      ...new Set(superOrder.orders.map((order: any) => order[field])),
    ].filter(Boolean);
  };

  const getTotalWeight = () => {
    if (!superOrder) return 0;
    return superOrder.orders.reduce(
      (total, order) => total + (order.weight || 0),
      0
    );
  };

  const getDateRange = () => {
    if (!superOrder || !superOrder.orders.length) return "";

    const dates = superOrder.orders.map((order) => new Date(order.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
  };

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 hover:shadow-md"
      style={{
        color: "#0B2863",
        borderColor: "#0B2863",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#0B2863";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#0B2863";
      }}
    >
      Close
    </button>
  );

  const StatusChip = ({ status }: { status: number }) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold`}
      style={{
        backgroundColor: status === 1 ? "#22c55e" : "#FFE67B",
        color: status === 1 ? "#ffffff" : "#0B2863",
      }}
    >
      {status === 1 ? "Paid" : "Unpaid"}
    </span>
  );

  const DaysChip = ({ days }: { days: number }) => {
    let bgColor = "#6b7280"; // gray
    if (days > 3) bgColor = "#22c55e"; // green
    else if (days > 1) bgColor = "#0B2863"; // blue

    return (
      <span
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: bgColor }}
      >
        {days}
      </span>
    );
  };

  const RoleChip = ({ role }: { role: string }) => (
    <span
      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border"
      style={{
        backgroundColor: "rgba(11, 40, 99, 0.1)",
        color: "#0B2863",
        borderColor: "#0B2863",
      }}
    >
      {role}
    </span>
  );

  const LocationChip = ({ location }: { location: string }) => (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
      style={{
        backgroundColor: "rgba(255, 230, 123, 0.3)",
        color: "#0B2863",
        borderColor: "#FFE67B",
      }}
    >
      {location}
    </span>
  );

  const JobChip = ({ job }: { job: string }) => (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: "#0B2863",
        color: "#ffffff",
      }}
    >
      {job}
    </span>
  );

  if (!superOrder) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          border: "2px solid #0B2863",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b-2"
        style={{
          backgroundColor: "#0B2863",
          borderBottomColor: "#FFE67B",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <Typography variant="h4" className="!font-bold !text-white">
              Super Order Details
            </Typography>
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mt-2"
              style={{
                backgroundColor: "#FFE67B",
                color: "#0B2863",
              }}
            >
              {superOrder.key_ref}
            </div>
          </div>
        </div>
      </div>

      <DialogContent className="!p-6">
        {/* General Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📋</span>
            <Typography
              variant="h5"
              className="!font-bold"
              style={{ color: "#0B2863" }}
            >
              General Information
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: "#f8fafc",
                borderColor: "#0B2863",
              }}
            >
              <Typography
                variant="caption"
                className="!text-gray-600 !font-semibold !block"
              >
                Client
              </Typography>
              <Typography
                variant="h6"
                className="!font-bold !mt-1"
                style={{ color: "#0B2863" }}
              >
                {superOrder.client}
              </Typography>
            </div>

            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: "#f0fdf4",
                borderColor: "#22c55e",
              }}
            >
              <Typography
                variant="caption"
                className="!text-gray-600 !font-semibold !block"
              >
                Total Orders
              </Typography>
              <Typography
                variant="h6"
                className="!font-bold !mt-1"
                style={{ color: "#22c55e" }}
              >
                {superOrder.orders.length}
              </Typography>
            </div>

            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: "#fffbeb",
                borderColor: "#FFE67B",
              }}
            >
              <Typography
                variant="caption"
                className="!text-gray-600 !font-semibold !block"
              >
                Total Weight
              </Typography>
              <Typography
                variant="h6"
                className="!font-bold !mt-1"
                style={{ color: "#0B2863" }}
              >
                {getTotalWeight().toLocaleString()} lbs
              </Typography>
            </div>

            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: "#f0fdf4",
                borderColor: "#22c55e",
              }}
            >
              <Typography
                variant="caption"
                className="!text-gray-600 !font-semibold !block"
              >
                Total Income
              </Typography>
              <Typography
                variant="h6"
                className="!font-bold !mt-1"
                style={{ color: "#22c55e" }}
              >
                ${superOrder.totalIncome.toLocaleString()}
              </Typography>
            </div>

            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor:
                  superOrder.totalProfit >= 0 ? "#f0fdf4" : "#fef2f2",
                borderColor:
                  superOrder.totalProfit >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              <Typography
                variant="caption"
                className="!text-gray-600 !font-semibold !block"
              >
                Total Profit
              </Typography>
              <Typography
                variant="h6"
                className="!font-bold !mt-1"
                style={{
                  color: superOrder.totalProfit >= 0 ? "#22c55e" : "#ef4444",
                }}
              >
                ${superOrder.totalProfit.toLocaleString()}
              </Typography>
            </div>

            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: "#fffbeb",
                borderColor: "#FFE67B",
              }}
            >
              <Typography
                variant="caption"
                className="!text-gray-600 !font-semibold !block"
              >
                Payment Status
              </Typography>
              <div className="mt-2">
                <StatusChip status={superOrder.payStatus} />
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="mb-4">
            <Typography
              variant="subtitle1"
              className="!font-semibold !mb-2"
              style={{ color: "#0B2863" }}
            >
              Locations
            </Typography>
            <div className="flex flex-wrap gap-2">
              {getUniqueValues("state").map((location, index) => (
                <LocationChip key={index} location={location} />
              ))}
            </div>
          </div>

          {/* Job Types */}
          <div className="mb-4">
            <Typography
              variant="subtitle1"
              className="!font-semibold !mb-2"
              style={{ color: "#0B2863" }}
            >
              Job Types
            </Typography>
            <div className="flex flex-wrap gap-2">
              {getUniqueValues("job").map((job, index) => (
                <JobChip key={index} job={job} />
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Typography
              variant="subtitle1"
              className="!font-semibold !mb-2"
              style={{ color: "#0B2863" }}
            >
              Date Range
            </Typography>
            <div
              className="inline-flex items-center px-4 py-2 rounded-lg border-2"
              style={{
                backgroundColor: "#FFE67B",
                borderColor: "#0B2863",
                color: "#0B2863",
              }}
            >
              <span className="mr-2">📅</span>
              <Typography variant="body1" className="!font-semibold">
                {getDateRange()}
              </Typography>
            </div>
          </div>
        </div>

        <hr className="my-6" style={{ borderColor: "#0B2863", opacity: 0.3 }} />

        {/* Operators Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👥</span>
            <Typography
              variant="h5"
              className="!font-bold"
              style={{ color: "#0B2863" }}
            >
              Participating Operators ({operators.length})
            </Typography>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <CircularProgress style={{ color: "#0B2863" }} />
            </div>
          ) : error ? (
            <div
              className="p-4 rounded-xl border-2 text-center"
              style={{
                backgroundColor: "#fef2f2",
                borderColor: "#ef4444",
                color: "#ef4444",
              }}
            >
              <Typography variant="body1" className="!font-semibold">
                {error}
              </Typography>
            </div>
          ) : operators.length === 0 ? (
            <div
              className="p-8 rounded-xl border-2 text-center"
              style={{
                backgroundColor: "#f8fafc",
                borderColor: "#0B2863",
              }}
            >
              <span className="text-4xl mb-3 block">👤</span>
              <Typography
                variant="h6"
                className="!font-semibold !mb-2"
                style={{ color: "#0B2863" }}
              >
                No operators found
              </Typography>
              <Typography variant="body2" className="!text-gray-600">
                No operators found for this super order.
              </Typography>
            </div>
          ) : (
            <div
              className="rounded-xl border-2 overflow-hidden"
              style={{ borderColor: "#0B2863" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: "#0B2863" }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Operator
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wide">
                        Total Days
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wide">
                        Orders
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Roles
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Work Dates
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.map((operator, index) => (
                      <tr
                        key={operator.operatorId}
                        className="border-b transition-colors duration-200"
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderBottomColor: "#e5e7eb",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e0f2fe";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            index % 2 === 0 ? "#ffffff" : "#f8fafc";
                        }}
                      >
                        <td className="px-4 py-3">
                          <Typography
                            variant="body2"
                            className="!font-semibold"
                            style={{ color: "#0B2863" }}
                          >
                            {operator.operatorName}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="!text-gray-600"
                          >
                            {operator.operatorCode} (ID: {operator.operatorId})
                          </Typography>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <DaysChip days={operator.totalDays} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Typography
                            variant="body2"
                            className="!font-semibold"
                            style={{ color: "#0B2863" }}
                          >
                            {operator.orders.length}
                          </Typography>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {operator.roles.map((role, index) => (
                              <RoleChip key={index} role={role} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {operator.assignedDates.map((date, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: "#FFE67B",
                                  color: "#0B2863",
                                }}
                              >
                                {new Date(date).toLocaleDateString()}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Individual Orders Summary */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📦</span>
            <Typography
              variant="h5"
              className="!font-bold"
              style={{ color: "#0B2863" }}
            >
              Individual Orders ({superOrder.orders.length})
            </Typography>
          </div>

          <div
            className="rounded-xl border-2 overflow-hidden"
            style={{ borderColor: "#0B2863" }}
          >
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead style={{ backgroundColor: "#0B2863" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wide">
                      Job
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-white uppercase tracking-wide">
                      Weight
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-white uppercase tracking-wide">
                      Income
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {superOrder.orders.map((order, index) => (
                    <tr
                      key={order.key}
                      className="border-b transition-colors duration-200"
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottomColor: "#e5e7eb",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e0f2fe";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          index % 2 === 0 ? "#ffffff" : "#f8fafc";
                      }}
                    >
                      <td className="px-4 py-3">
                        <Typography
                          variant="body2"
                          className="!font-mono !text-sm"
                          style={{ color: "#0B2863" }}
                        >
                          {order.key.substring(0, 8)}...
                        </Typography>
                      </td>
                      <td className="px-4 py-3">
                        <Typography
                          variant="body2"
                          style={{ color: "#0B2863" }}
                        >
                          {new Date(order.date).toLocaleDateString()}
                        </Typography>
                      </td>
                      <td className="px-4 py-3">
                        <Typography
                          variant="body2"
                          style={{ color: "#0B2863" }}
                        >
                          {order.state}
                        </Typography>
                      </td>
                      <td className="px-4 py-3">
                        <Typography
                          variant="body2"
                          style={{ color: "#0B2863" }}
                        >
                          {order.job}
                        </Typography>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Typography
                          variant="body2"
                          className="!font-semibold"
                          style={{ color: "#0B2863" }}
                        >
                          {order.weight?.toLocaleString() || 0}
                        </Typography>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Typography
                          variant="body2"
                          className="!font-bold"
                          style={{ color: "#22c55e" }}
                        >
                          ${order.income?.toLocaleString() || 0}
                        </Typography>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusChip status={order.payStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions
        className="!p-6 !border-t-2"
        style={{ borderTopColor: "#0B2863" }}
      >
        <CloseButton />
      </DialogActions>
    </Dialog>
  );
};

export default SuperOrderDetailsDialog;
