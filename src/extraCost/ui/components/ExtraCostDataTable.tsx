/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  Inbox,
  FileX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { ExtraCost, ExtraCostResponse } from "../../domain/ExtraCostModel";

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: "right" | "left" | "center";
  sortable?: boolean;
  copyable?: boolean;
  format?: (value: unknown, row?: ExtraCost) => string | React.ReactNode;
}

interface SortConfig {
  key: string | null;
  direction: "asc" | "desc" | null;
}

interface ExtraCostDataTableProps {
  data: ExtraCostResponse | null;
  loading: boolean;
  searchTerm?: string;
  onContextMenu?: (event: React.MouseEvent, row: ExtraCost) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const getISOWeek = (dateStr: string): number => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const yearStartDay = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDay);
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// ── Image Modal ────────────────────────────────────────────────────────────────
const ImageModal: React.FC<{
  url: string;
  keyRef: string;
  onClose: () => void;
}> = ({ url, keyRef, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
    onClick={onClose}
  >
    <div
      className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-[#0B2863] to-[#1e3a8a] px-6 py-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <ImageIcon size={22} />
            <div>
              <p className="font-bold text-base">Receipt Image</p>
              <p className="text-xs text-blue-200">{keyRef}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-50 flex items-center justify-center">
        <img
          src={url}
          alt="Receipt"
          className="max-w-full max-h-[70vh] rounded-lg shadow-md object-contain"
          onError={(e) => {
            e.currentTarget.src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="14">Image not available</text></svg>';
          }}
        />
      </div>

      <div className="bg-gray-100 px-6 py-2 text-center">
        <p className="text-xs text-gray-500">Click outside to close</p>
      </div>
    </div>
  </div>
);

// ── Misc ───────────────────────────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="inline-block animate-spin rounded-lg h-5 w-5 border-b-2 border-[#0B2863]" />
);

const getNestedValue = (obj: any, path: string): any =>
  path.split(".").reduce((current, key) => current?.[key], obj);

const sortData = (data: ExtraCost[], sortConfig: SortConfig): ExtraCost[] => {
  if (!sortConfig.key || !sortConfig.direction) return data;

  return [...data].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case "extraCostName":
        aValue = a.name;
        bValue = b.name;
        break;
      case "extraCostType":
        aValue = a.type;
        bValue = b.type;
        break;
      case "extraCostCost":
        aValue = parseFloat(a.cost);
        bValue = parseFloat(b.cost);
        break;
      case "key_ref":
        aValue = a.order.key_ref;
        bValue = b.order.key_ref;
        break;
      case "date":
        aValue = new Date(a.order.date);
        bValue = new Date(b.order.date);
        break;
      case "status":
        aValue = a.order.status;
        bValue = b.order.status;
        break;
      case "client_name":
        aValue = `${a.order.person.first_name} ${a.order.person.last_name}`;
        bValue = `${b.order.person.first_name} ${b.order.person.last_name}`;
        break;
      case "state_usa":
        aValue = a.order.state_usa;
        bValue = b.order.state_usa;
        break;
      case "week":
        aValue = getISOWeek(a.order.date);
        bValue = getISOWeek(b.order.date);
        break;
      default:
        aValue = getNestedValue(a, sortConfig.key || "");
        bValue = getNestedValue(b, sortConfig.key || "");
    }

    if (aValue === null || aValue === undefined)
      return sortConfig.direction === "asc" ? 1 : -1;
    if (bValue === null || bValue === undefined)
      return sortConfig.direction === "asc" ? -1 : 1;

    const aNum = Number(aValue);
    const bNum = Number(bValue);
    if (!isNaN(aNum) && !isNaN(bNum))
      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
};

const SortIcon: React.FC<{ column: Column; sortConfig: SortConfig }> = ({
  column,
  sortConfig,
}) => {
  if (!column.sortable) return null;
  const isActive = sortConfig.key === column.id;
  const iconColor = isActive ? "#F09F52" : "#9CA3AF";
  if (isActive)
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={12} style={{ color: iconColor }} />
    ) : (
      <ArrowDown size={12} style={{ color: iconColor }} />
    );
  return <ArrowUpDown size={12} style={{ color: iconColor }} />;
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const ExtraCostDataTable: React.FC<ExtraCostDataTableProps> = ({
  data,
  loading,
  searchTerm = "",
  onContextMenu,
}) => {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "desc",
  });
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [imageModal, setImageModal] = useState<{
    url: string;
    keyRef: string;
  } | null>(null);

  const columns: Column[] = useMemo(
    () => [
      {
        id: "expand",
        label: "",
        minWidth: 30,
        align: "center",
        sortable: false,
      },
      {
        id: "actions",
        label: t("extraCostTable.columns.actions"),
        minWidth: 30,
        align: "center",
        sortable: false,
      },
      {
        id: "extraCostName",
        label: t("extraCostTable.columns.extraCostName"),
        minWidth: 30,
        sortable: true,
        format: (value) => (
          <span className="font-semibold text-xs text-[#0B2863]">
            {String(value || "N/A")}
          </span>
        ),
      },
      {
        id: "extraCostType",
        label: t("extraCostTable.columns.type"),
        minWidth: 30,
        sortable: true,
        format: (value) => (
          <span className="font-semibold text-xs text-[#0B2863]">
            {String(value || "N/A")}
          </span>
        ),
      },
      {
        id: "extraCostCost",
        label: t("extraCostTable.columns.costAmount"),
        minWidth: 30,
        sortable: true,
        align: "right",
        format: (value) => {
          const num = Number(value);
          return (
            <span className="font-bold text-sm text-green-500">
              $
              {num
                ? num.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </span>
          );
        },
      },
      {
        id: "key_ref",
        label: t("extraCostTable.columns.orderReference"),
        minWidth: 30,
        sortable: true,
        copyable: true,
      },
      {
        id: "client_name",
        label: t("extraCostTable.columns.client"),
        minWidth: 30,
        sortable: true,
        format: (_value, row) => {
          if (!row) return "N/A";
          const name =
            `${row.order.person.first_name} ${row.order.person.last_name}`.trim();
          return (
            <span className="text-xs font-medium text-gray-700">
              {name || "N/A"}
            </span>
          );
        },
      },
      {
        id: "date",
        label: t("extraCostTable.columns.date"),
        minWidth: 30,
        sortable: true,
        format: (value) => {
          const d = new Date(String(value || ""));
          return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
        },
      },
      {
        id: "week",
        label: t("extraCostTable.columns.week"),
        minWidth: 30,
        sortable: true,
        align: "center",
        format: (_value, row) => {
          if (!row) return "N/A";
          const week = getISOWeek(row.order.date);
          return (
            <span className="font-semibold text-xs text-[#0B2863]">
              W{week}
            </span>
          );
        },
      },
      {
        id: "status",
        label: t("extraCostTable.columns.orderStatus"),
        minWidth: 30,
        sortable: true,
        format: (value) => {
          const status = String(value || "").toLowerCase();
          const statusStyles: Record<string, string> = {
            finished: "bg-green-500 text-white",
            pending: "bg-[#F09F52] text-white",
            inactive: "bg-red-500 text-white",
            default: "bg-gray-500 text-white",
          };
          return (
            <span
              className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                statusStyles[status] || statusStyles.default
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        id: "state_usa",
        label: t("extraCostTable.columns.location"),
        minWidth: 30,
        sortable: true,
      },
    ],
    [t]
  );

  const extraCosts = data?.results || [];

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return extraCosts;
    const lw = searchTerm.toLowerCase();
    return extraCosts.filter(
      (cost) =>
        cost.order.key_ref.toLowerCase().includes(lw) ||
        cost.order.person?.first_name?.toLowerCase().includes(lw) ||
        cost.order.person?.last_name?.toLowerCase().includes(lw) ||
        cost.name?.toLowerCase().includes(lw) ||
        cost.type?.toLowerCase().includes(lw) ||
        cost.order.state_usa?.toLowerCase().includes(lw) ||
        cost.cost?.toString().includes(lw)
    );
  }, [extraCosts, searchTerm]);

  const sortedData = useMemo(
    () => sortData(filteredData, sortConfig),
    [filteredData, sortConfig]
  );

  const handleExpandClick = useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column?.sortable) return;
      setSortConfig((prev) => {
        if (prev.key === columnId) {
          if (prev.direction === "asc")
            return { key: columnId, direction: "desc" };
          if (prev.direction === "desc") return { key: null, direction: null };
        }
        return { key: columnId, direction: "asc" };
      });
    },
    [columns]
  );

  const handleCopyToClipboard = useCallback(
    async (e: React.MouseEvent, value: string, rowId: string) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        setCopiedRef(rowId);
        setTimeout(() => setCopiedRef(null), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    []
  );

  const handleRowSelect = useCallback((rowId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (all: boolean) => {
      if (all) {
        setSelectedRows(new Set(sortedData.map((r) => String(r.id_workCost))));
      } else {
        setSelectedRows(new Set());
      }
    },
    [sortedData]
  );

  const isSelected = useCallback(
    (rowId: string) => selectedRows.has(rowId),
    [selectedRows]
  );
  const isAllSelected =
    sortedData.length > 0 && selectedRows.size === sortedData.length;

  const getColumnValue = (row: ExtraCost, columnId: string): unknown => {
    switch (columnId) {
      case "extraCostName":
        return row.name;
      case "extraCostType":
        return row.type;
      case "extraCostCost":
        return parseFloat(row.cost);
      case "key_ref":
        return row.order.key_ref;
      case "client_name":
        return `${row.order.person.first_name} ${row.order.person.last_name}`;
      case "date":
        return row.order.date;
      case "week":
        return getISOWeek(row.order.date);
      case "status":
        return row.order.status;
      case "state_usa":
        return row.order.state_usa;
      default:
        return getNestedValue(row, columnId);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md border border-[#0B2863] overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: "600px" }}>
          <table className="w-full border-collapse">
            {/* ── Head ── */}
            <thead className="sticky top-0 z-10 bg-[#0B2863]">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-2 border-white w-3.5 h-3.5"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={sortedData.length === 0}
                  />
                </th>
                {columns.map((column, index) => (
                  <th
                    key={`header-${column.id}-${index}`}
                    className={`px-3 py-2 font-bold text-xs whitespace-nowrap text-white ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                        ? "text-center"
                        : "text-left"
                    } ${column.sortable ? "cursor-pointer hover:bg-blue-800 transition-colors duration-200" : ""}`}
                    style={{ minWidth: column.minWidth }}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{column.label}</span>
                      <SortIcon column={column} sortConfig={sortConfig} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* ── Body ── */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-10">
                    <div className="flex flex-col items-center space-y-3">
                      <LoadingSpinner />
                      <span className="text-gray-500 text-sm">
                        {t("extraCostTable.loading")}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Inbox size={64} className="text-[#0B2863] opacity-60" />
                      <div className="text-center">
                        <h3 className="text-lg font-bold mb-1 text-[#0B2863]">
                          {t("extraCostTable.empty.title")}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 max-w-md">
                          {t("extraCostTable.empty.desc")}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <FileX size={14} />
                          <span>{t("extraCostTable.empty.tip")}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row, rowIndex) => {
                  const rowId = String(row.id_workCost);
                  const isRowSelected = isSelected(rowId);
                  const isExpanded = expandedRows.has(rowId);
                  const hasImage = !!row.image_url;

                  return (
                    <React.Fragment key={rowId}>
                      <tr
                        className={`transition-all duration-200 hover:shadow-sm cursor-pointer ${
                          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } ${isRowSelected ? "ring-1 ring-blue-200" : ""}`}
                        style={{
                          backgroundColor: isRowSelected
                            ? "rgba(11, 40, 99, 0.08)"
                            : undefined,
                        }}
                        onContextMenu={(e) => onContextMenu?.(e, row)}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="rounded border-2 w-3.5 h-3.5 border-[#0B2863]"
                            checked={isRowSelected}
                            onChange={() => handleRowSelect(rowId)}
                          />
                        </td>

                        {/* Expand */}
                        <td className="px-3 py-2 text-center">
                          <button
                            className="p-1 rounded-lg transition-all duration-200 hover:shadow-sm bg-[#0B2863] text-white"
                            onClick={() => handleExpandClick(rowId)}
                            title={
                              isExpanded
                                ? t("extraCostTable.expand.collapse")
                                : t("extraCostTable.expand.expand")
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        </td>

                        {/* Actions — receipt icon */}
                        <td className="px-3 py-2 text-center">
                          <button
                            className={`p-1.5 rounded-lg transition-all duration-200 ${
                              hasImage
                                ? "hover:shadow-sm hover:bg-blue-50 cursor-pointer"
                                : "opacity-25 cursor-not-allowed"
                            }`}
                            style={{ color: "#0B2863" }}
                            disabled={!hasImage}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasImage) {
                                setImageModal({
                                  url: row.image_url!,
                                  keyRef: row.order.key_ref,
                                });
                              }
                            }}
                            title={
                              hasImage
                                ? t("extraCostTable.actions.viewImage")
                                : t("extraCostTable.actions.noImage")
                            }
                          >
                            <ImageIcon size={16} />
                          </button>
                        </td>

                        {/* Data columns */}
                        {columns.slice(2).map((column, columnIndex) => {
                          const value = getColumnValue(row, column.id);
                          const displayValue = column.format
                            ? column.format(value, row)
                            : String(value ?? "N/A");
                          const isCopyable =
                            column.copyable && column.id === "key_ref";
                          const cellValue = String(value ?? "");
                          const isCopied =
                            copiedRef === `${rowId}-${column.id}`;

                          return (
                            <td
                              key={`${rowId}-${column.id}-${columnIndex}`}
                              className={`px-3 py-2 text-xs whitespace-nowrap ${
                                column.align === "right"
                                  ? "text-right"
                                  : column.align === "center"
                                  ? "text-center"
                                  : "text-left"
                              } ${isCopyable ? "group relative" : ""}`}
                              onContextMenu={
                                isCopyable
                                  ? (e) =>
                                      handleCopyToClipboard(
                                        e,
                                        cellValue,
                                        `${rowId}-${column.id}`
                                      )
                                  : undefined
                              }
                            >
                              <div className="flex items-center gap-1.5">
                                {displayValue}
                                {isCopyable && (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-0.5 rounded hover:bg-gray-200"
                                    onClick={(e) =>
                                      handleCopyToClipboard(
                                        e,
                                        cellValue,
                                        `${rowId}-${column.id}`
                                      )
                                    }
                                    title={t("extraCostTable.copyToClipboard")}
                                  >
                                    <Copy
                                      size={12}
                                      style={{
                                        color: isCopied ? "#22c55e" : "#0B2863",
                                      }}
                                    />
                                  </button>
                                )}
                              </div>
                              {isCopied && (
                                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                                  {t("extraCostTable.copied")}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* ── Expanded row ── */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-0 py-0">
                            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Order details */}
                                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-100">
                                    <p className="text-xs font-medium tracking-widest uppercase text-gray-500">
                                      {t("extraCostTable.details.orderDetails")}
                                    </p>
                                  </div>
                                  <div className="divide-y divide-gray-100">
                                    {[
                                      {
                                        label: t("extraCostTable.details.orderRef"),
                                        value: (
                                          <span className="font-medium text-xs text-[#0B2863]">
                                            {row.order.key_ref}
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.client"),
                                        value: (
                                          <span className="font-medium text-xs text-gray-800">
                                            {`${row.order.person.first_name} ${row.order.person.last_name}`.trim() ||
                                              "N/A"}
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.email"),
                                        value: (
                                          <span className="text-xs text-blue-600">
                                            {row.order.person.email || "N/A"}
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.phone"),
                                        value: (
                                          <span className="text-xs text-gray-700">
                                            {row.order.person.phone || "N/A"}
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.week"),
                                        value: (
                                          <span className="font-medium text-xs text-[#0B2863]">
                                            W{getISOWeek(row.order.date)}
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.distance"),
                                        value: (
                                          <span className="text-xs text-gray-700">
                                            {row.order.distance ?? "N/A"} mi
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.expense"),
                                        value: (
                                          <span className="text-xs font-medium text-red-600">
                                            ${row.order.expense || "0.00"}
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.income"),
                                        value: (
                                          <span className="text-xs font-medium text-green-600">
                                            ${row.order.income || "0.00"}
                                          </span>
                                        ),
                                      },
                                    ].map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between gap-4 px-3 py-2"
                                      >
                                        <span className="text-xs shrink-0 text-gray-400">
                                          {item.label}
                                        </span>
                                        <span className="text-right">
                                          {item.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Extra cost details */}
                                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-100">
                                    <p className="text-xs font-medium tracking-widest uppercase text-gray-500">
                                      {t("extraCostTable.details.extraCostDetails")}
                                    </p>
                                  </div>
                                  <div className="divide-y divide-gray-100">
                                    {[
                                      {
                                        label: t("extraCostTable.details.name"),
                                        value: (
                                          <span className="font-medium text-xs text-[#0B2863]">
                                            {row.name}
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.type"),
                                        value: (
                                          <span className="font-medium text-xs text-[#0B2863]">
                                            {row.type}
                                          </span>
                                        ),
                                      },
                                      {
                                        label: t("extraCostTable.details.cost"),
                                        value: (
                                          <span className="text-base font-medium text-green-600">
                                            $
                                            {parseFloat(
                                              row.cost
                                            ).toLocaleString("en-US", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                          </span>
                                        ),
                                      },
                                    ].map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between gap-4 px-3 py-2"
                                      >
                                        <span className="text-xs shrink-0 text-gray-400">
                                          {item.label}
                                        </span>
                                        <span className="text-right">
                                          {item.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Receipt image */}
                                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-100">
                                    <p className="text-xs font-medium tracking-widest uppercase text-gray-500">
                                      {t("extraCostTable.details.receiptImage")}
                                    </p>
                                  </div>
                                  <div className="p-3">
                                    {row.image_url ? (
                                      <img
                                        src={row.image_url}
                                        alt="Receipt"
                                        className="w-full rounded-lg object-cover cursor-pointer transition-transform hover:scale-105"
                                        style={{
                                          height: "140px",
                                          borderRadius: "8px",
                                          border: "0.5px solid #e2e8f0",
                                        }}
                                        onClick={() =>
                                          setImageModal({
                                            url: row.image_url!,
                                            keyRef: row.order.key_ref,
                                          })
                                        }
                                        title={t("extraCostTable.actions.viewImage")}
                                      />
                                    ) : (
                                      <div className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 h-[140px]">
                                        <ImageIcon size={24} className="text-gray-300" />
                                        <span className="text-xs text-gray-400">
                                          {t("extraCostTable.actions.noImage")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-[#0B2863] px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-700">
            {t("extraCostTable.footer.total", {
              count: data?.count || 0,
              selected: selectedRows.size,
            })}
          </span>
          <span className="text-xs text-gray-700">
            {t("extraCostTable.footer.showing", { count: sortedData.length })}
          </span>
        </div>
      </div>

      {/* Image Modal */}
      {imageModal && (
        <ImageModal
          url={imageModal.url}
          keyRef={imageModal.keyRef}
          onClose={() => setImageModal(null)}
        />
      )}
    </>
  );
};

export default ExtraCostDataTable;