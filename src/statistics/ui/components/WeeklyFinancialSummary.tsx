/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { PaymentStatusStats } from "../../domain/PaymentStatusModels";
import {
  BarChart3,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
} from "lucide-react";

interface PaymentStatusChartProps {
  currentStats: PaymentStatusStats;
  previousStats: PaymentStatusStats;
  changes: {
    totalOrdersChange: number;
    paidOrdersChange: number;
    unpaidOrdersChange: number;
    paidPercentageChange: number;
    totalIncomeChange?: number;
    totalExpenseChange?: number;
    netProfitChange?: number;
  };
  loading?: boolean;
}

const PaymentStatusChart: React.FC<PaymentStatusChartProps> = ({
  currentStats,
  previousStats,
  loading = false,
}) => {
  const safe = (v?: number | null) =>
    typeof v === "number" && !isNaN(v) ? v : 0;

  /* ----------- METRICS ----------- */
  const paidIncome = safe(currentStats.paidIncome);
  const unpaidIncome = safe(currentStats.unpaidIncome);
  const totalIncome = paidIncome + unpaidIncome;
  const totalExpenses = safe(currentStats.totalExpenses);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome
    ? (netProfit / totalIncome) * 100
    : 0;

  const prevIncome =
    safe(previousStats.paidIncome) +
    safe(previousStats.unpaidIncome);
  const prevExpenses = safe(previousStats.totalExpenses);
  const prevProfit = prevIncome - prevExpenses;

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center font-bold text-[#0B2863]">
        Loading payment status...
      </div>
    );
  }

  /* ----------- PIE (DONUT) ----------- */
  const pieOption: EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: (p: any) => `
        <b>${p.name}</b><br/>
        Orders: ${p.value}<br/>
        Amount: $${p.data.amount.toLocaleString()}
      `,
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#0B2863", fontWeight: 600 },
    },
    series: [
      {
        type: "pie",
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 3,
        },
        label: {
          position: "outside",
          color: "#0B2863",
          fontWeight: "bold",
          formatter: "{b}\n{d}%",
        },
        labelLine: {
          lineStyle: { color: "#0B2863" },
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 12,
            shadowColor: "rgba(0,0,0,0.25)",
          },
        },
        data: [
          {
            name: "Paid Orders",
            value: currentStats.paidOrders,
            amount: paidIncome,
            itemStyle: { color: "#22c55e" },
          },
          {
            name: "Unpaid Orders",
            value: currentStats.unpaidOrders,
            amount: unpaidIncome,
            itemStyle: { color: "#f59e0b" },
          },
        ],
      },
    ],
  };

  /* ----------- BAR (COMPARISON) ----------- */
  const barOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (items: any[]) =>
        items
          .map(
            (i) =>
              `<b>${i.seriesName}</b>: $${(
                i.value * 1000
              ).toLocaleString()}`
          )
          .join("<br/>"),
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#0B2863", fontWeight: 600 },
    },
    xAxis: {
      type: "category",
      data: ["This Week", "Last Week"],
      axisLabel: { color: "#0B2863", fontWeight: 600 },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#0B2863",
        formatter: "${value}K",
      },
      splitLine: { lineStyle: { color: "#e5e7eb" } },
    },
    series: [
      {
        name: "Income",
        type: "bar",
        data: [
          +(totalIncome / 1000).toFixed(2),
          +(prevIncome / 1000).toFixed(2),
        ],
        itemStyle: { color: "#0ea5e9" },
      },
      {
        name: "Expenses",
        type: "bar",
        data: [
          +(totalExpenses / 1000).toFixed(2),
          +(prevExpenses / 1000).toFixed(2),
        ],
        itemStyle: { color: "#ef4444" },
      },
      {
        name: "Profit",
        type: "bar",
        data: [
          +(netProfit / 1000).toFixed(2),
          +(prevProfit / 1000).toFixed(2),
        ],
        itemStyle: {
          color: netProfit >= 0 ? "#22c55e" : "#dc2626",
        },
      },
    ],
  };

  const money = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `$${(v / 1_000).toFixed(1)}K`
      : `$${v.toFixed(0)}`;

  /* ----------- UI ----------- */
  return (
    <div className="rounded-2xl border-2 border-[#0B2863] bg-white shadow-lg p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h3 className="text-2xl font-bold text-[#0B2863] flex items-center gap-2">
          <BarChart3 /> Weekly Financial Summary
        </h3>
        <div className="text-right">
          <div className="text-sm font-semibold text-[#0B2863]">
            Total Orders
          </div>
          <div className="text-3xl font-bold text-[#0B2863]">
            {currentStats.totalOrders}
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Metric icon={<DollarSign />} label="Total Income" value={money(totalIncome)} color="text-sky-500" />
        <Metric icon={<CreditCard />} label="Total Expenses" value={money(totalExpenses)} color="text-red-500" />
        <Metric
          icon={netProfit >= 0 ? <TrendingUp /> : <TrendingDown />}
          label="Net Profit"
          value={money(netProfit)}
          color={netProfit >= 0 ? "text-green-500" : "text-red-500"}
          footer={`${profitMargin.toFixed(1)}% margin`}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Payment Distribution" icon={<Target size={16} />}>
          <ReactECharts option={pieOption} style={{ height: 320 }} />
        </ChartCard>
        <ChartCard title="Weekly Comparison ($K)" icon={<BarChart3 size={16} />}>
          <ReactECharts option={barOption} style={{ height: 420 }} />
        </ChartCard>
      </div>

    </div>
  );
};

/* ---------- SUB COMPONENTS ---------- */

const Metric = ({ icon, label, value, color, footer }: any) => (
  <div className="rounded-xl border-2 p-4 bg-gray-50">
    <div className={`flex items-center gap-2 font-semibold ${color}`}>
      {icon} {label}
    </div>
    <div className={`text-3xl font-bold mt-2 ${color}`}>{value}</div>
    {footer && <div className="text-xs text-gray-600">{footer}</div>}
  </div>
);

const ChartCard = ({ title, icon, children }: any) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <h4 className="font-bold mb-3 text-[#0B2863] flex items-center gap-2">
      {icon} {title}
    </h4>
    {children}
  </div>
);


export default PaymentStatusChart;
