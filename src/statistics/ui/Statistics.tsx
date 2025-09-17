import { useState, useEffect, useCallback, useRef } from "react";
import StatsComparisonCard from "./components/StatsComparisonCard";
import TruckStatistics from "./TruckStatistics";
import PaymentStatusChart from "./components/PaymentStatusChart";
import PaidUnpaidWeekRangeChart from "./components/PaidUnpaidWeekRangeChart";
import LoaderSpinner from "../../componets/Login_Register/LoadingSpinner";
import {
  fetchOrdersCountWithComparison,
  fetchPaymentStatusWithComparison,
  fetchClientStatsWithComparison,
  fetchOrdersBasicDataList,
} from "../data/repositoryStatistics";
import { OrdersCountStats } from "../domain/OrdersCountModel";
import { PaymentStatusComparison } from "../domain/PaymentStatusModels";
import { ClientStatsComparison } from "../domain/OrdersWithClientModels";
import { OrdersBasicDataResponse } from "../domain/BasicOrdersDataModels";
import PayrollStatistics from "./PayrollStatistics";
import { useNavigate } from "react-router-dom";
import HistoricalAnalysis from "./HistoricalAnalysis";

interface StatItem {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  color: "blue" | "green" | "orange" | "red"; // Removed "purple"
}

// Service to get available years from 2015 to current year + 1
const getAvailableYearsFromService = (): number[] => {
  const currentYear = new Date().getFullYear();
  const startYear = 2015;
  const endYear = currentYear + 1;
  const years = [];

  for (let i = endYear; i >= startYear; i--) {
    years.push(i);
  }

  return years; // Most recent first
};

const Statistics = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<
    "overview" | "trucks" | "payroll" | "historical"
  >("overview");

  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const now = new Date();
    return getWeekOfYear(now);
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  // Week dropdown states
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"select" | "input">("select");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Available years from service
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const [statsData, setStatsData] = useState<StatItem[]>([]);

  const [ordersCountStats, setOrdersCountStats] =
    useState<OrdersCountStats | null>(null);
  const [paymentStatusData, setPaymentStatusData] =
    useState<PaymentStatusComparison>({
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

  const [clientStats, setClientStats] = useState<ClientStatsComparison>({
    currentStats: {
      totalClients: 0,
      activeClients: 0,
      totalFactories: 0,
      activeFactories: 0,
      topClients: [],
      topFactories: [],
      totalOrders: 0,
      averageOrdersPerClient: 0,
      averageOrdersPerFactory: 0,
    },
    previousStats: {
      totalClients: 0,
      activeClients: 0,
      totalFactories: 0,
      activeFactories: 0,
      topClients: [],
      topFactories: [],
      totalOrders: 0,
      averageOrdersPerClient: 0,
      averageOrdersPerFactory: 0,
    },
    changes: {
      totalClientsChange: 0,
      activeClientsChange: 0,
      totalFactoriesChange: 0,
      totalOrdersChange: 0,
    },
  });

  const [basicOrdersData, setBasicOrdersData] =
    useState<OrdersBasicDataResponse | null>(null);

  console.log("Orders Count Stats:", ordersCountStats);
  console.log("ClientStats", clientStats);
  console.log("basicOrdersData", basicOrdersData);

  // Load available years on component mount
  useEffect(() => {
    try {
      const years = getAvailableYearsFromService();
      setAvailableYears(years);
    } catch (err) {
      console.error("Error loading available years:", err);
    }
  }, []);

  // Custom scrollbar styles
  useEffect(() => {
    const styleId = "statistics-custom-styles";

    // Remove existing style if it exists
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
      }
      
      .week-dropdown-container {
        z-index: 9999 !important;
        position: relative;
      }
      
      .week-dropdown {
        z-index: 10000 !important;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowWeekDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getWeekOfYear(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
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
      const startDate = new Date(
        firstDayOfYear.getTime() + daysOffset * 86400000
      );
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

        const weekRange = getWeekRange(year, week);
        console.log(
          "Loading statistics for week:",
          week,
          "year:",
          year,
          "range:",
          weekRange
        );

        const { currentStats, comparison } =
          await fetchOrdersCountWithComparison(year, week);
        setOrdersCountStats(currentStats);

        const basicData = await fetchOrdersBasicDataList(year, week);
        setBasicOrdersData(basicData);

        const paymentComparison = await fetchPaymentStatusWithComparison(
          year,
          week
        );
        setPaymentStatusData(paymentComparison);

        const clientComparison = await fetchClientStatsWithComparison(
          year,
          week
        );
        setClientStats(clientComparison);

        const realStatsData: StatItem[] = [
          {
            label: "Total Orders (Week)",
            value: currentStats.totalOrders,
            change: comparison.totalOrdersChange,
            icon: "fa-box",
            color: "green",
          },
          {
            label: "Avg Orders/Day",
            value: currentStats.averagePerDay,
            change: comparison.averagePerDayChange,
            icon: "fa-chart-line",
            color: "blue",
          },
          {
            label: "Peak Day Orders",
            value: currentStats.peakDay?.count || 0,
            change: comparison.peakDayChange,
            icon: "fa-arrow-up",
            color: "orange", // Changed from "purple" to "orange"
          },
          {
            label: "Active Days (Week)",
            value: currentStats.daysWithOrders,
            change: comparison.activeDaysChange,
            icon: "fa-calendar-check",
            color: "orange",
          },
          {
            label: "Unique Clients",
            value: clientComparison.currentStats.totalClients,
            change: clientComparison.changes.totalClientsChange,
            icon: "fa-users",
            color: "blue",
          },
          {
            label: "Customer Factories",
            value: clientComparison.currentStats.totalFactories,
            change: clientComparison.changes.totalFactoriesChange,
            icon: "fa-industry",
            color: "red",
          },
        ];

        setStatsData(realStatsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error loading statistics"
        );
        console.error("Error loading statistics:", err);
      } finally {
        setLoading(false);
      }
    },
    [getWeekRange, activeSection]
  );

  const handleOrderCardClick = () => {
    navigate(`/order-breakdown?year=${selectedYear}&week=${selectedWeek}`);
  };

  useEffect(() => {
    loadStatistics(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear, loadStatistics]);

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const week = Number(e.target.value);
    if (week >= 1 && week <= 53) {
      setSelectedWeek(week);
    }
  };

  const handleWeekSelect = (selectedWeek: number) => {
    setSelectedWeek(selectedWeek);
    setShowWeekDropdown(false);
  };

  const handleWeekKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowWeekDropdown(true);
    } else if (e.key === "Escape") {
      setShowWeekDropdown(false);
    } else if (e.key === "Enter") {
      setShowWeekDropdown(!showWeekDropdown);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number(e.target.value);
    setSelectedYear(year);
  };

  const weekRange = getWeekRange(selectedYear, selectedWeek);
  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);

  // Styled Components
  const TabButton = ({
    active,
    onClick,
    icon,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    icon: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
        active ? "text-white shadow-lg" : "hover:shadow-md"
      }`}
      style={{
        backgroundColor: active ? "#0B2863" : "transparent",
        color: active ? "#ffffff" : "#0B2863",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "rgba(11, 40, 99, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      <i className={`fas ${icon}`}></i>
      {children}
    </button>
  );

  const RefreshButton = () => (
    <button
      onClick={() => loadStatistics(selectedWeek, selectedYear)}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border-2 hover:shadow-md disabled:opacity-50"
      style={{
        color: "#0B2863",
        borderColor: "#0B2863",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.backgroundColor = "#0B2863";
          e.currentTarget.style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#0B2863";
        }
      }}
    >
      <i className={`fas fa-sync-alt ${loading ? "animate-spin" : ""}`}></i>
      Refresh
    </button>
  );

  if (error && activeSection === "overview") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <div
          className="text-center p-8 rounded-2xl border-2 shadow-lg"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#ef4444",
          }}
        >
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-5xl"></i>
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ color: "#0B2863" }}>
            Error Loading Statistics
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => loadStatistics(selectedWeek, selectedYear)}
            className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: "#0B2863" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#f8fafc" }}>
      <div className="min-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#0B2863" }}>
            Statistics Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Monitor your business performance and key metrics
          </p>
        </div>

        {/* Navigation Card */}
        <div
          className="rounded-2xl shadow-lg p-6 border-2 week-dropdown-container relative"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#0B2863",
          }}
        >
          {/* Animated border */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{
              background: "linear-gradient(90deg, #2563eb, #9333ea, #2563eb)",
              backgroundSize: "200% 100%",
              animation: "gradient 3s ease-in-out infinite",
            }}
          ></div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2">
              <TabButton
                active={activeSection === "overview"}
                onClick={() => setActiveSection("overview")}
                icon="fa-chart-line"
              >
                Business Overview
              </TabButton>
              <TabButton
                active={activeSection === "trucks"}
                onClick={() => setActiveSection("trucks")}
                icon="fa-truck"
              >
                Vehicle Logistics
              </TabButton>
              <TabButton
                active={activeSection === "payroll"}
                onClick={() => setActiveSection("payroll")}
                icon="fa-users"
              >
                Payroll Analytics
              </TabButton>
              <TabButton
                active={activeSection === "historical"}
                onClick={() => setActiveSection("historical")}
                icon="fa-history"
              >
                Historical Analysis
              </TabButton>
            </div>

            {/* Period Info & Refresh (overview only) */}
            {activeSection === "overview" && (
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2"
                  style={{
                    backgroundColor: "#FFE67B",
                    borderColor: "#0B2863",
                    color: "#0B2863",
                  }}
                >
                  <i className="fas fa-calendar-alt"></i>
                  <span className="font-semibold">
                    {weekRange.start} → {weekRange.end}
                  </span>
                </div>
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "#0B2863" }}
                >
                  <i className="fas fa-chart-line"></i>
                  <span className="font-medium">vs Previous Week</span>
                </div>
                <RefreshButton />
              </div>
            )}
          </div>

          {/* Enhanced Filters (overview only) */}
          {activeSection === "overview" && (
            <div
              className="flex flex-wrap items-start gap-6 mt-6 pt-6 border-t"
              style={{ borderColor: "rgba(11, 40, 99, 0.2)" }}
            >
              {/* Year Select Dropdown - Vertical */}
              <div className="min-w-[180px]">
                <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 font-semibold text-center bg-white shadow-sm text-blue-700 hover:border-blue-300 cursor-pointer"
                    disabled={loading}
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year} className="font-semibold">
                        {year}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {availableYears.length > 0 && (
                      <>Range: 2015-{availableYears[0]}</>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Week Selector */}
              <div className="min-w-[200px]">
                <div
                  className="bg-gradient-to-br from-white/90 to-green-50/50 backdrop-blur-sm rounded-xl p-4 border-2 border-green-100 shadow-sm hover:shadow-md transition-all duration-300"
                  ref={dropdownRef}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Week Number
                    </label>
                    <button
                      onClick={() =>
                        setViewMode(viewMode === "select" ? "input" : "select")
                      }
                      className="text-xs bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200 px-2 py-1 rounded-md border border-green-200"
                      title={`Switch to ${
                        viewMode === "select" ? "input" : "dropdown"
                      } view`}
                    >
                      {viewMode === "select" ? "Input" : "Dropdown"}
                    </button>
                  </div>

                  {viewMode === "select" ? (
                    // Week dropdown mode
                    <div className="relative">
                      <div
                        className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 font-bold text-center bg-white cursor-pointer flex items-center justify-between shadow-sm hover:border-green-300 hover:shadow-sm"
                        onClick={() => setShowWeekDropdown(!showWeekDropdown)}
                        onKeyDown={handleWeekKeyDown}
                        tabIndex={0}
                      >
                        <span className="text-green-700">
                          Week {selectedWeek}
                        </span>
                        <svg
                          className={`w-4 h-4 text-green-500 transition-transform duration-200 ${
                            showWeekDropdown ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {showWeekDropdown && (
                        <div className="week-dropdown mt-2 bg-white border-2 border-green-200 rounded-lg shadow-xl w-[350px]">
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-semibold text-gray-600">
                                Select week (1-53):
                              </span>
                              <button
                                onClick={() => setShowWeekDropdown(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Quick actions */}
                            <div className="flex gap-1 mb-3">
                              <button
                                onClick={() => handleWeekSelect(1)}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded transition-colors"
                              >
                                First
                              </button>
                              <button
                                onClick={() => handleWeekSelect(13)}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded transition-colors"
                              >
                                Q1
                              </button>
                              <button
                                onClick={() => handleWeekSelect(26)}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded transition-colors"
                              >
                                Mid
                              </button>
                              <button
                                onClick={() => handleWeekSelect(39)}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded transition-colors"
                              >
                                Q3
                              </button>
                              <button
                                onClick={() => handleWeekSelect(53)}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded transition-colors"
                              >
                                Last
                              </button>
                            </div>

                            <div className="grid grid-cols-9 gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                              {weeks.map((weekNum) => (
                                <button
                                  key={weekNum}
                                  onClick={() => handleWeekSelect(weekNum)}
                                  className={`p-2 text-sm rounded-md border transition-all duration-200 font-medium hover:scale-105 ${
                                    selectedWeek === weekNum
                                      ? "bg-green-500 text-white border-green-600 shadow-md ring-2 ring-green-300"
                                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-green-100 hover:border-green-300 hover:text-green-700"
                                  }`}
                                  title={`Select week ${weekNum}`}
                                >
                                  {weekNum}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Week input mode
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="53"
                        value={selectedWeek}
                        onChange={handleWeekChange}
                        className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 font-bold text-center bg-white shadow-sm"
                        placeholder="1-53"
                        disabled={loading}
                      />
                      <div className="absolute -bottom-5 left-0 right-0 text-xs text-gray-500 text-center">
                        Press Enter to confirm
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Date Info */}
              <div className="flex-1 min-w-[300px]">
                <div className="bg-gradient-to-br from-white/90 to-amber-50/50 backdrop-blur-sm rounded-xl p-4 border-2 border-amber-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <span className="text-amber-700 text-lg">📅</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-amber-800 uppercase tracking-wide">
                          Selected Period
                        </div>
                        <div className="text-amber-700 font-semibold text-lg">
                          {weekRange.start} → {weekRange.end}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-amber-100 border border-amber-200"
                      style={{ color: "#0B2863" }}
                    >
                      <i className="fas fa-chart-line"></i>
                      <span className="font-medium">vs Previous Week</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content based on active section */}
        {activeSection === "overview" && (
          <>
            {/* Loading State with LoadingSpinner */}
            {loading && (
              <div
                className="flex items-center justify-center py-16 rounded-2xl border-2"
                style={{
                  backgroundColor: "#ffffff",
                  borderColor: "#0B2863",
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <LoaderSpinner />
                  <span
                    className="text-lg font-semibold"
                    style={{ color: "#0B2863" }}
                  >
                    Loading statistics...
                  </span>
                </div>
              </div>
            )}

            {/* Main Content */}
            {!loading && (
              <div className="space-y-8">
                {/* Payment Status Chart */}
                <div>
                  <PaymentStatusChart
                    currentStats={paymentStatusData.currentStats}
                    previousStats={paymentStatusData.previousStats}
                    changes={paymentStatusData.changes}
                    loading={loading}
                  />
                </div>
                
                {/* Stats Comparison Card */}
                <div className="min-w-7xl">
                  <div>
                    <StatsComparisonCard
                      title="Business Metrics"
                      stats={statsData}
                      onStatClick={handleOrderCardClick}
                    />
                  </div>
                </div>
                
                {/* Paid/Unpaid Week Range Chart */}
                <div>
                  <PaidUnpaidWeekRangeChart
                    initialYear={selectedYear}
                    initialStartWeek={Math.max(1, selectedWeek - 5)}
                    initialEndWeek={Math.min(53, selectedWeek + 5)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Other sections */}
        {activeSection === "trucks" && (
          <TruckStatistics
            initialWeek={selectedWeek}
            initialYear={selectedYear}
          />
        )}

        {activeSection === "payroll" && <PayrollStatistics />}

        {activeSection === "historical" && <HistoricalAnalysis />}
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default Statistics;