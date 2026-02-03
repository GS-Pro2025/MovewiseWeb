import { useState, useEffect, useCallback } from "react";
import TruckStatistics from "./TruckStatistics";
import PaymentStatusChart from "./components/WeeklyFinancialSummary";
import PaidUnpaidWeekRangeChart from "./components/PaidUnpaidWeekRangeChart";
import LoaderSpinner from "../../components/Login_Register/LoadingSpinner";
import {
  fetchOrdersCountWithComparison,
  fetchPaymentStatusWithComparison,
  fetchClientStatsWithComparison,
  fetchOrdersBasicDataList,
} from "../data/repositoryStatistics";
import { PaymentStatusComparison } from "../domain/PaymentStatusModels";
import PayrollStatistics from "./PayrollStatistics";
import HistoricalAnalysis from "./HistoricalAnalysis";
import FinancialView from "../../financials/ui/FinancialView";
import IncomeCalculator from "./components/IncomeCalculator";
import FinancialExpenseBreakdownView from "../../financials/ui/FinancialExpenseBreakdownView";
import { useTranslation } from "react-i18next";

interface StatItem {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  color: "blue" | "green" | "orange" | "red" | "purple";
}

const getAvailableYearsFromService = (): number[] => {
  const currentYear = new Date().getFullYear();
  const startYear = 2015;
  const endYear = currentYear + 1;
  const years = [];

  for (let i = endYear; i >= startYear; i--) {
    years.push(i);
  }

  return years;
};

const Statistics = () => {
  const { i18n } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<
    "overview" | "trucks" | "payroll" | "historical" | "financials" | "expenseBreakdown"
  >("overview");

  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const now = new Date();
    return getWeekOfYear(now);
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [statsData, setStatsData] = useState<StatItem[]>([]);

  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusComparison>({
    currentStats: {
      totalOrders: 0,
      paidOrders: 0,
      unpaidOrders: 0,
      paidPercentage: 0,
      unpaidPercentage: 0,
      totalIncome: 0,
      paidIncome: 0,
      unpaidIncome: 0,
    },
    previousStats: {
      totalOrders: 0,
      paidOrders: 0,
      unpaidOrders: 0,
      paidPercentage: 0,
      unpaidPercentage: 0,
      totalIncome: 0,
      paidIncome: 0,
      unpaidIncome: 0,
    },
    changes: {
      totalOrdersChange: 0,
      paidOrdersChange: 0,
      unpaidOrdersChange: 0,
      paidPercentageChange: 0,
    },
  });

  useEffect(() => {
    try {
      const years = getAvailableYearsFromService();
      setAvailableYears(years);
    } catch (err) {
      console.error("Error loading available years:", err);
    }
  }, []);

  function getWeekOfYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 4));
    const yearStartDayNum = yearStart.getUTCDay() || 7;
    yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  const getWeekRange = useCallback(
    (year: number, week: number): { start: string; end: string } => {
      const firstDayOfYear = new Date(year, 0, 1);
      const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
      const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
      const endDate = new Date(startDate.getTime() + 6 * 86400000);

      return {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      };
    },
    []
  );

  const loadStatistics = useCallback(
    async (week: number, year: number) => {
      if (activeSection !== "overview") return;

      try {
        setLoading(true);
        setError(null);

        const { currentStats, comparison } = await fetchOrdersCountWithComparison(year, week);

        await fetchOrdersBasicDataList(year, week);

        const paymentComparison = await fetchPaymentStatusWithComparison(year, week);
        setPaymentStatusData(paymentComparison);

        const clientComparison = await fetchClientStatsWithComparison(year, week);

        const realStatsData: StatItem[] = [
          {
            label: "Total Orders",
            value: currentStats.totalOrders,
            change: comparison.totalOrdersChange,
            icon: "fa-box",
            color: "blue",
          },
          {
            label: "Avg Orders/Day",
            value: currentStats.averagePerDay.toFixed(1),
            change: comparison.averagePerDayChange,
            icon: "fa-chart-line",
            color: "green",
          },
          {
            label: "Peak Day Orders",
            value: currentStats.peakDay?.count || 0,
            change: comparison.peakDayChange,
            icon: "fa-arrow-up",
            color: "orange",
          },
          {
            label: "Active Days",
            value: currentStats.daysWithOrders,
            change: comparison.activeDaysChange,
            icon: "fa-calendar-check",
            color: "purple",
          },
          {
            label: "Active Clients",
            value: clientComparison.currentStats.activeClients,
            change: clientComparison.changes.activeClientsChange,
            icon: "fa-users",
            color: "blue",
          },
          {
            label: "Factories",
            value: clientComparison.currentStats.totalFactories,
            change: clientComparison.changes.totalFactoriesChange,
            icon: "fa-industry",
            color: "red",
          },
        ];

        setStatsData(realStatsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading statistics");
        console.error("Error loading statistics:", err);
      } finally {
        setLoading(false);
      }
    },
    [activeSection]
  );

  useEffect(() => {
    loadStatistics(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear, loadStatistics]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number(e.target.value);
    setSelectedYear(year);
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const week = Number(e.target.value);
    setSelectedWeek(week);
  };

  const handleTabClick = (section: typeof activeSection) => {
    setActiveSection(section);
  };

  const weekRange = getWeekRange(selectedYear, selectedWeek);

  const TabButton = ({
    active,
    onClick,
    icon,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    icon: string;
    children: string;
  }) => {
    return (
      <button
        onClick={onClick}
        className={`px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 text-sm ${
          active ? "bg-blue-900 text-white shadow-md" : "bg-gray-300 text-blue-900 hover:bg-gray-200"
        }`}
      >
        <i className={`fas ${icon} text-xs`}></i>
        <span className="hidden sm:inline">{children}</span>
        <span className="sm:hidden">{children.split(" ")[0]}</span>
      </button>
    );
  };

  const StatCard = ({ stat }: { stat: StatItem }) => {
    const colorMap = {
      blue: { bg: "bg-blue-100", text: "text-blue-600", icon: "text-blue-600" },
      green: { bg: "bg-green-100", text: "text-green-600", icon: "text-green-600" },
      orange: { bg: "bg-orange-100", text: "text-orange-600", icon: "text-orange-600" },
      red: { bg: "bg-red-100", text: "text-red-600", icon: "text-red-600" },
      purple: { bg: "bg-purple-100", text: "text-purple-600", icon: "text-purple-600" },
    };

    const colors = colorMap[stat.color];

    return (
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colors.bg}`}>
            <i className={`fas ${stat.icon} ${colors.icon} text-sm`}></i>
          </div>
          {stat.change !== undefined && (
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${
                stat.change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="text-xl font-bold text-gray-800 mb-1">{stat.value}</div>
        <div className="text-xs text-gray-600">{stat.label}</div>
      </div>
    );
  };

  if (error && activeSection === "overview") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center p-6 rounded-xl border-2 shadow-lg max-w-md w-full bg-white border-red-500">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h3 className="text-lg font-bold mb-3 text-blue-900">Error Loading Statistics</h3>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => loadStatistics(selectedWeek, selectedYear)}
            className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg bg-blue-900"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div key={i18n.language} className="notranslate min-h-screen  p-3 sm:p-4 w-full">
      <div className="max-w-9xl mx-auto space-y-4">
        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border-2 border-blue-900">
          <div className="flex flex-col gap-3">
            {/* Title and Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-blue-900">Statistics Dashboard</h1>
                <p className="text-xs text-gray-600 mt-1">
                  {weekRange.start} → {weekRange.end}
                </p>
              </div>

              {activeSection === "overview" && (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    disabled={loading}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-semibold hover:border-blue-500 focus:border-blue-500 transition-all"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedWeek}
                    onChange={handleWeekChange}
                    disabled={loading}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-semibold hover:border-blue-500 focus:border-blue-500 transition-all"
                  >
                    {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                      <option key={week} value={week}>
                        W{week}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => loadStatistics(selectedWeek, selectedYear)}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-900 text-white rounded-lg text-sm hover:bg-blue-800 transition-all disabled:opacity-50 font-semibold"
                  >
                    <i className={`fas fa-sync-alt ${loading ? "animate-spin" : ""}`}></i>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <TabButton
                active={activeSection === "overview"}
                onClick={() => handleTabClick("overview")}
                icon="fa-chart-line"
              >
                Business Overview
              </TabButton>
              <TabButton
                active={activeSection === "trucks"}
                onClick={() => handleTabClick("trucks")}
                icon="fa-truck"
              >
                Vehicle Logistics
              </TabButton>
              <TabButton
                active={activeSection === "payroll"}
                onClick={() => handleTabClick("payroll")}
                icon="fa-users"
              >
                Payroll Analytics
              </TabButton>
              <TabButton
                active={activeSection === "historical"}
                onClick={() => handleTabClick("historical")}
                icon="fa-history"
              >
                Historical Analysis
              </TabButton>
              <TabButton
                active={activeSection === "financials"}
                onClick={() => handleTabClick("financials")}
                icon="fa-coins"
              >
                Financials
              </TabButton>
              <TabButton
                active={activeSection === "expenseBreakdown"}
                onClick={() => handleTabClick("expenseBreakdown")}
                icon="fa-file-invoice-dollar"
              >
                Expense Breakdown
              </TabButton>
            </div>
          </div>
        </div>

        {/* Content based on active section */}
        {activeSection === "overview" && (
          <>
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12 bg-white rounded-xl border-2 border-blue-900">
                <div className="flex flex-col items-center gap-4">
                  <LoaderSpinner />
                  <span className="text-base font-semibold text-blue-900">Loading statistics...</span>
                </div>
              </div>
            )}

            {/* Main Content */}
            {!loading && (
              <div className="space-y-4">
                {/* Compact Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {statsData.map((stat, index) => (
                    <StatCard key={index} stat={stat} />
                  ))}
                </div>

                {/* Payment Status Chart */}
                <div className="w-full">
                  <PaymentStatusChart
                    currentStats={paymentStatusData.currentStats}
                    previousStats={paymentStatusData.previousStats}
                    changes={paymentStatusData.changes}
                    loading={loading}
                  />
                </div>

                {/* Income Calculator */}
                <div className="w-full">
                  <IncomeCalculator />
                </div>

                {/* Paid/Unpaid Week Range Chart */}
                <div className="w-full overflow-x-auto">
                  {selectedYear >= 2000 && selectedWeek >= 1 && selectedWeek <= 53 && (
                    <PaidUnpaidWeekRangeChart
                      initialYear={selectedYear}
                      initialStartWeek={Math.max(1, selectedWeek - 5)}
                      initialEndWeek={Math.min(53, selectedWeek + 5)}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Other sections */}
        {activeSection === "trucks" && (
          <div className="w-full">
            <TruckStatistics initialWeek={selectedWeek} initialYear={selectedYear} />
          </div>
        )}

        {activeSection === "payroll" && (
          <div className="w-full">
            <PayrollStatistics />
          </div>
        )}

        {activeSection === "historical" && (
          <div className="w-full">
            <HistoricalAnalysis />
          </div>
        )}

        {activeSection === "financials" && (
          <div className="w-full bg-white rounded-xl shadow-sm p-4 border-2 border-blue-900">
            <FinancialView />
          </div>
        )}

        {activeSection === "expenseBreakdown" && (
          <div className="w-full bg-white rounded-xl shadow-sm p-4 border-2 border-blue-900">
            <FinancialExpenseBreakdownView />
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;