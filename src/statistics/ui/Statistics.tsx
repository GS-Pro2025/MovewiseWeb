import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
import IncomeCalculator from "./components/IncomeCalculator";


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
  for (let i = endYear; i >= startYear; i--) years.push(i);
  return years;
};

function getWeekOfYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const Statistics = () => {
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  type ActiveSection = "overview" | "trucks" | "payroll" | "historical" ;

  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");

  const [selectedWeek, setSelectedWeek] = useState<number>(() => getWeekOfYear(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [statsData, setStatsData] = useState<StatItem[]>([]);

  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusComparison>({
    currentStats: {
      totalOrders: 0, paidOrders: 0, unpaidOrders: 0,
      paidPercentage: 0, unpaidPercentage: 0,
      totalIncome: 0, paidIncome: 0, unpaidIncome: 0,
    },
    previousStats: {
      totalOrders: 0, paidOrders: 0, unpaidOrders: 0,
      paidPercentage: 0, unpaidPercentage: 0,
      totalIncome: 0, paidIncome: 0, unpaidIncome: 0,
    },
    changes: {
      totalOrdersChange: 0, paidOrdersChange: 0,
      unpaidOrdersChange: 0, paidPercentageChange: 0,
    },
  });

  useEffect(() => {
    try {
      setAvailableYears(getAvailableYearsFromService());
    } catch (err) {
      console.error("Error loading available years:", err);
    }
  }, []);

  const getWeekRange = useCallback((year: number, week: number): { start: string; end: string } => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    const startDate = new Date(firstDayOfYear.getTime() + daysOffset * 86400000);
    const endDate = new Date(startDate.getTime() + 6 * 86400000);
    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  }, []);

  const loadStatistics = useCallback(async (week: number, year: number) => {
    if (activeSection !== "overview") return;
    try {
      setLoading(true);
      setError(null);

      const { currentStats, comparison } = await fetchOrdersCountWithComparison(year, week);
      await fetchOrdersBasicDataList(year, week);
      const paymentComparison = await fetchPaymentStatusWithComparison(year, week);
      setPaymentStatusData(paymentComparison);
      const clientComparison = await fetchClientStatsWithComparison(year, week);

      setStatsData([
        { label: t("statistics.stats.totalOrders"),   value: currentStats.totalOrders,                    change: comparison.totalOrdersChange,      icon: "fa-box",           color: "blue"   },
        { label: t("statistics.stats.avgOrdersDay"),  value: currentStats.averagePerDay.toFixed(1),        change: comparison.averagePerDayChange,    icon: "fa-chart-line",    color: "green"  },
        { label: t("statistics.stats.peakDayOrders"), value: currentStats.peakDay?.count || 0,             change: comparison.peakDayChange,          icon: "fa-arrow-up",      color: "orange" },
        { label: t("statistics.stats.activeDays"),    value: currentStats.daysWithOrders,                  change: comparison.activeDaysChange,       icon: "fa-calendar-check",color: "purple" },
        { label: t("statistics.stats.activeClients"), value: clientComparison.currentStats.activeClients,  change: clientComparison.changes.activeClientsChange,   icon: "fa-users",    color: "blue" },
        { label: t("statistics.stats.factories"),     value: clientComparison.currentStats.totalFactories, change: clientComparison.changes.totalFactoriesChange,  icon: "fa-industry", color: "red"  },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading statistics");
    } finally {
      setLoading(false);
    }
  }, [activeSection, t]);

  // ✅ Recarga solo overview cuando cambian semana/año
  useEffect(() => {
    if (activeSection === "overview") {
      loadStatistics(selectedWeek, selectedYear);
    }
  }, [selectedWeek, selectedYear, loadStatistics, activeSection]);

  const weekRange = getWeekRange(selectedYear, selectedWeek);

  const TabButton = ({
    active, onClick, icon, children,
  }: {
    active: boolean; onClick: () => void; icon: string; children: string;
  }) => (
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

  const StatCard = ({ stat }: { stat: StatItem }) => {
    const colorMap = {
      blue:   { bg: "bg-blue-100",   text: "text-blue-600",   icon: "text-blue-600"   },
      green:  { bg: "bg-green-100",  text: "text-green-600",  icon: "text-green-600"  },
      orange: { bg: "bg-orange-100", text: "text-orange-600", icon: "text-orange-600" },
      red:    { bg: "bg-red-100",    text: "text-red-600",    icon: "text-red-600"    },
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
            <span className={`text-xs font-bold px-2 py-1 rounded ${stat.change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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
          <h3 className="text-lg font-bold mb-3 text-blue-900">{t("statistics.errorTitle")}</h3>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => loadStatistics(selectedWeek, selectedYear)}
            className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg bg-blue-900"
          >
            {t("statistics.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div key={i18n.language} className="notranslate min-h-screen p-3 sm:p-4 w-full">
      <div className="max-w-9xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border-2 border-blue-900">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-blue-900">{t("statistics.title")}</h1>
                <p className="text-xs text-gray-600 mt-1">{weekRange.start} → {weekRange.end}</p>
              </div>

              {activeSection === "overview" && (
                <div className="flex flex-wrap items-center gap-2">
                  <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                    disabled={loading}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-semibold hover:border-blue-500 focus:border-blue-500 transition-all">
                    {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>

                  <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    disabled={loading}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-semibold hover:border-blue-500 focus:border-blue-500 transition-all">
                    {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                      <option key={week} value={week}>W{week}</option>
                    ))}
                  </select>

                  <button onClick={() => loadStatistics(selectedWeek, selectedYear)} disabled={loading}
                    className="px-3 py-2 bg-blue-900 text-white rounded-lg text-sm hover:bg-blue-800 transition-all disabled:opacity-50 font-semibold">
                    <i className={`fas fa-sync-alt ${loading ? "animate-spin" : ""}`}></i>
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              {([
                { key: "overview",         icon: "fa-chart-line",          label: t("statistics.tabs.overview")         },
                { key: "trucks",           icon: "fa-truck",               label: t("statistics.tabs.trucks")           },
                { key: "payroll",          icon: "fa-users",               label: t("statistics.tabs.payroll")          },
                { key: "historical",       icon: "fa-history",             label: t("statistics.tabs.historical")       },
              ] as const).map(({ key, icon, label }) => (
                <TabButton key={key} active={activeSection === key} onClick={() => setActiveSection(key)} icon={icon}>
                  {label}
                </TabButton>
              ))}
            </div>
          </div>
        </div>

        {/* Overview */}
        {activeSection === "overview" && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-12 bg-white rounded-xl border-2 border-blue-900">
                <div className="flex flex-col items-center gap-4">
                  <LoaderSpinner />
                  <span className="text-base font-semibold text-blue-900">{t("statistics.loadingStatistics")}</span>
                </div>
              </div>
            )}
            {!loading && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {statsData.map((stat, index) => <StatCard key={index} stat={stat} />)}
                </div>
                <div className="w-full">
                  <PaymentStatusChart
                    currentStats={paymentStatusData.currentStats}
                    previousStats={paymentStatusData.previousStats}
                    changes={paymentStatusData.changes}
                    loading={loading}
                  />
                </div>
                <div className="w-full"><IncomeCalculator /></div>
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

        {/* ✅ Hijos reciben semana/año como props — se actualizan sin remontar toda la pantalla */}
        {activeSection === "trucks" && (
          <div className="w-full">
            <TruckStatistics initialWeek={selectedWeek} initialYear={selectedYear} />
          </div>
        )}
        {activeSection === "payroll"    && <div className="w-full"><PayrollStatistics /></div>}
        {activeSection === "historical" && <div className="w-full"><HistoricalAnalysis /></div>}
        
      </div>
    </div>
  );
};

export default Statistics;