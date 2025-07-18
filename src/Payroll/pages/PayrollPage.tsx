import React, { useState, useEffect, useMemo } from "react";
import { payrollService, WeekInfo, getPaymentById } from "../../service/PayrollService";
import { PayrollModal } from "../components/PayrollModal";
import LoaderSpinner from "../../componets/LoadingSpinner";
import {
  fetchCountries,
  fetchStates,
  fetchCities,
} from "../../createOrder/repository/repositoryLocation";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

// Imports de los nuevos módulos
import { 
  weekdayKeys, 
  LocationStep, 
  OperatorRow, 
  WeekAmounts, 
} from '../../models/payrroll';
import { 
  formatCurrency, 
  formatDateForHeader, 
  getISOWeek, 
  generateWeekDates 
} from '../util/PayrollUtil';
import PayrollExport from '../util/PayrollExport';

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<OperatorRow[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [weekDates, setWeekDates] = useState<{
    [key in keyof WeekAmounts]?: string;
  }>({});
  const [week, setWeek] = useState(() => getISOWeek(new Date()));
  const [selectedOperator, setSelectedOperator] = useState<OperatorRow | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para país, estado y ciudad
  const [countries, setCountries] = useState<{ country: string }[]>([]);
  const [states, setStates] = useState<{ name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [locationStep, setLocationStep] = useState<LocationStep>("country");

  // Cargar países al montar
  useEffect(() => {
    fetchCountries().then((countries) => {
      setCountries(countries.map((c) => ({ country: c.name })));
    });
  }, []);

  // Cargar estados cuando cambia el país
  useEffect(() => {
    if (country) {
      fetchStates(country).then(setStates);
      setState("");
      setCities([]);
      setCity("");
      setLocationStep("state");
    }
  }, [country]);

  // Cargar ciudades cuando cambia el estado
  useEffect(() => {
    if (country && state) {
      fetchCities(country, state).then(setCities);
      setCity("");
      setLocationStep("city");
    }
  }, [state]);

  // Resetear todo si se borra el input
  useEffect(() => {
    if (!country) {
      setState("");
      setCity("");
      setStates([]);
      setCities([]);
      setLocationStep("country");
    } else if (!state) {
      setCity("");
      setCities([]);
      setLocationStep("state");
    } else if (!city) {
      setLocationStep("city");
    }
  }, [country, state, city]);

  // Construir el string location
  const locationString = useMemo(() => {
    if (!country) return "";
    let loc = country;
    if (state) loc += `, ${state}`;
    if (city) loc += `, ${city}`;
    return loc;
  }, [country, state, city]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const response = await payrollService(week, currentYear, locationString);

      // Generar mapeo de fechas para los encabezados
      const dates = generateWeekDates(
        response.week_info.start_date
      );
      setWeekDates(dates);

      const map = new Map<string, OperatorRow>();
      // Map para cachear payments y evitar llamadas duplicadas
      const paymentCache = new Map<string, number>();

      // PASO 1: Crear la estructura básica de cada operador y obtener bonus único
      response.data.forEach((d) => {
        const key = d.code;
        const assignId = d.id_assign;
        const payId = d.id_payment;

        if (!map.has(key)) {
          map.set(key, {
            code: d.code,
            name: d.first_name,
            lastName: d.last_name,
            role: d.role,
            cost: d.salary,
            pay: payId ? payId.toString() : null,
            total: 0,
            additionalBonuses: 0,
            expense: 0,
            grandTotal: 0,
            assignmentIds: [assignId],
            paymentIds: payId != null ? [payId] : [],
            assignmentsByDay: {},
            // Set temporal para controlar los días sumados
            _bonusDaysAdded: new Set<string>(),
          } as any);
        } else {
          const ex = map.get(key)!;
          ex.assignmentIds.push(assignId);
          if (payId != null && !ex.paymentIds.includes(payId)) {
            ex.paymentIds.push(payId);
          }
        }

        const dataDate = d.date.split("T")[0];
        const dayKey = Object.entries(dates).find(
          ([, date]) => date === dataDate
        )?.[0] as keyof WeekAmounts;
        if (dayKey) {
          const ex = map.get(key)!;
          // Solo suma el bonus si aún no se sumó para ese día
          if (!(ex as any)._bonusDaysAdded.has(dayKey)) {
            ex.additionalBonuses += Number(d.bonus) || 0;
            (ex as any)._bonusDaysAdded.add(dayKey);
          }
          if (!ex.assignmentsByDay![dayKey]) ex.assignmentsByDay![dayKey] = [];
          ex.assignmentsByDay![dayKey]!.push({
            id: assignId,
            date: dataDate,
            bonus: Number(d.bonus) || 0,
          });
        }
      });

      // PASO 1.5: OBTENER EXPENSES DE LOS PAYMENTS
      const paymentPromises: Promise<void>[] = [];
      
      // Recopilar todos los payment_ids únicos
      const uniquePaymentIds = new Set<string>();
      Array.from(map.values()).forEach(operator => {
        operator.paymentIds.forEach(payId => {
          if (payId && !uniquePaymentIds.has(payId.toString())) {
            uniquePaymentIds.add(payId.toString());
          }
        });
      });

      // Hacer llamadas para obtener expenses
      for (const paymentId of uniquePaymentIds) {
        paymentPromises.push(
          getPaymentById(paymentId)
            .then(paymentData => {
              const expense = Number(paymentData.expense) || 0;
              paymentCache.set(paymentId, expense);
            })
            .catch(error => {
              console.error(`Error getting payment ${paymentId}:`, error);
              paymentCache.set(paymentId, 0);
            })
        );
      }

      // Esperar a que todas las llamadas de payment terminen
      await Promise.all(paymentPromises);

      // Asignar expenses a los operadores basado en sus payments
      Array.from(map.values()).forEach(operator => {
        let totalExpense = 0;
        const processedPayments = new Set<string>();
        
        operator.paymentIds.forEach(payId => {
          const paymentIdStr = payId.toString();
          if (!processedPayments.has(paymentIdStr)) {
            const expense = paymentCache.get(paymentIdStr) || 0;
            totalExpense += expense;
            processedPayments.add(paymentIdStr);
          }
        });
        
        operator.expense = totalExpense;
      });

      // PASO 2: Función para buscar si un operador trabajó en una fecha específica
      const findWorkDay = (
        operatorCode: string,
        targetDate: string
      ): number | null => {
        const workRecord = response.data.find((d) => {
          const dataDate = d.date.split("T")[0];
          return d.code === operatorCode && dataDate === targetDate;
        });
        return workRecord ? workRecord.salary : null;
      };

      // PASO 3: Mapear cada día de la semana para cada operador
      const operators = Array.from(map.values()).map((row) => {
        delete (row as any)._bonusDaysAdded;

        // Para cada día de la semana, buscar si trabajó
        weekdayKeys.forEach((dayKey) => {
          const dateForThisDay = dates[dayKey];
          if (dateForThisDay) {
            const salary = findWorkDay(row.code, dateForThisDay);
            if (salary !== null) {
              row[dayKey] = salary;
            }
          }
        });

        // Calcular totales - INCLUYENDO EXPENSE
        const daysWorked = weekdayKeys.filter(
          (day) => row[day] != null && row[day]! > 0
        ).length;
        row.total = daysWorked * row.cost;
        // Restar expense del grand total
        row.grandTotal = (row.total || 0) + (row.additionalBonuses || 0) - (row.expense || 0);

        return row;
      });

      setGrouped(operators);
      setWeekInfo(response.week_info);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, country, state, city]);

  const handleModalClose = () => {
    setSelectedOperator(null);
    fetchData();
  };

  const totalGrand = useMemo(
    () => grouped.reduce((sum, r) => sum + (r.grandTotal || 0), 0),
    [grouped]
  );
  const countDays = useMemo(
    () =>
      weekdayKeys.filter((day) => grouped.some((r) => r[day] != null)).length,
    [grouped]
  );

  // Filtrar operadores basado en el término de búsqueda
  const filteredOperators = useMemo(() => {
    if (!searchTerm.trim()) {
      return grouped;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = grouped.filter(
      (operator) =>
        operator.code.toLowerCase().includes(term) ||
        operator.name.toLowerCase().includes(term) ||
        operator.lastName.toLowerCase().includes(term)
    );

    return filtered;
  }, [grouped, searchTerm]);

  // Totales para los operadores filtrados
  const filteredTotalGrand = useMemo(
    () => filteredOperators.reduce((sum, r) => sum + (r.grandTotal || 0), 0),
    [filteredOperators]
  );

  // Total de expenses para las estadísticas
  const totalExpenses = useMemo(
    () => filteredOperators.reduce((sum, r) => sum + (r.expense || 0), 0),
    [filteredOperators]
  );

  // Contadores de pago para operadores filtrados
  const paymentStats = useMemo(() => {
    const paidOperators = filteredOperators.filter((r) => r.pay != null);
    const unpaidOperators = filteredOperators.filter((r) => r.pay == null);

    const paidAmount = paidOperators.reduce(
      (sum, r) => sum + (r.grandTotal || 0),
      0
    );
    const unpaidAmount = unpaidOperators.reduce(
      (sum, r) => sum + (r.grandTotal || 0),
      0
    );

    return {
      paid: paidOperators.length,
      unpaid: unpaidOperators.length,
      total: paidOperators.length + unpaidOperators.length,
      paidAmount,
      unpaidAmount,
    };
  }, [filteredOperators]);

  const changeWeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const w = parseInt(e.target.value, 10);
    if (!isNaN(w) && w >= 1 && w <= 53) {
      setWeek(w);
    }
  };

  // Opciones y labels dinámicos según el paso
  let options: any[] = [];
  let getOptionLabel: (option: any) => string = () => "";
  let label = "";
  let value: any = null;

  if (locationStep === "country") {
    options = countries;
    getOptionLabel = (o) => o.country;
    label = "Country";
    value = countries.find((c) => c.country === country) || null;
  } else if (locationStep === "state") {
    options = states;
    getOptionLabel = (o) => o.name;
    label = "State";
    value = states.find((s) => s.name === state) || null;
  } else if (locationStep === "city") {
    options = cities;
    getOptionLabel = (o) => o;
    label = "City";
    value = city || null;
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Operators Payroll
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 rounded-full border border-blue-200">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-blue-700 font-medium text-sm">Manage and track operator payments efficiently</span>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white/0 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-6 mb-6 relative overflow-hidden">
          {/* Animated border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-pulse" style={{ backgroundSize: '200% 100%' }}></div>
          
          {/* Main Controls */}
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    🔍 Search Operators
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by code, name, or last name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white/80"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-md"
                        title="Clear search"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location Input */}
            <div className="w-64">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-bold text-gray-700">
                      📍 Location
                    </label>
                    {locationString && (
                      <button
                        onClick={() => {
                          setCountry("");
                          setState("");
                          setCity("");
                          setStates([]);
                          setCities([]);
                          setLocationStep("country");
                        }}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors duration-200 flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded-md"
                        title="Clear location"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                      </button>
                    )}
                  </div>
                  <Autocomplete
                    options={options}
                    getOptionLabel={getOptionLabel}
                    value={value}
                    onChange={(_, newValue) => {
                      if (newValue === null) {
                        if (locationStep === "city") {
                          setCity("");
                          setLocationStep("state");
                        } else if (locationStep === "state") {
                          setState("");
                          setLocationStep("country");
                        } else if (locationStep === "country") {
                          setCountry("");
                        }
                      } else {
                        if (locationStep === "country") {
                          setCountry(newValue.country);
                        } else if (locationStep === "state") {
                          setState(newValue.name);
                        } else if (locationStep === "city") {
                          setCity(newValue);
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={label}
                        placeholder={`Select ${label.toLowerCase()}`}
                        size="small"
                        className="bg-white/80 rounded-lg"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      getOptionLabel(option) === getOptionLabel(value)
                    }
                    disableClearable={false}
                    disabled={locationStep === "state" && !country}
                  />
                  {locationString && (
                    <div className="mt-1 p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-purple-700 font-medium text-xs">
                        Selected: <span className="font-bold">{locationString}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Week Input */}
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  📅 Week Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="53"
                  value={week}
                  onChange={changeWeek}
                  className="w-20 px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 font-bold text-center bg-white/80"
                />
              </div>
            </div>
          </div>

          {/* Period and Export */}
          <div className="flex flex-col items-center mt-6 gap-4">
            {weekInfo && (
              <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-sm">
                <div>
                  <div className="text-sm font-bold text-amber-800">⏰ Period</div>
                  <div className="text-amber-700 font-semibold">
                    {weekInfo.start_date} → {weekInfo.end_date}
                  </div>
                </div>
              </div>
            )}
            {!loading && weekInfo && grouped.length > 0 && (
              <ErrorBoundary>
                <PayrollExport
                  operators={filteredOperators}
                  weekInfo={weekInfo}
                  weekDates={weekDates}
                  week={week}
                  location={locationString}
                  paymentStats={paymentStats}
                  totalGrand={filteredTotalGrand}
                />
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-8 border-red-400 p-6 mb-8 rounded-r-2xl shadow-lg">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-xl p-3 mr-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700 font-bold text-lg">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white/0 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="transform scale-75">
                <LoaderSpinner />
              </div>
              <p className="text-gray-500 mt-4 font-medium">
                Loading payroll data...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="bg-blue-700/0 rounded-2xl p-6 mb-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 opacity-80"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Working Days */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">{countDays}</div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Working Days</div>
                </div>

                {/* Total Operators */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-green-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-green-100 rounded-lg p-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {filteredOperators.length}
                    {filteredOperators.length !== grouped.length && (
                      <span className="text-lg text-gray-400"> / {grouped.length}</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {searchTerm ? "Filtered" : "Total"} Operators
                  </div>
                </div>

                {/* Payment Status */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-orange-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-orange-100 rounded-lg p-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{paymentStats.paid}</div>
                      <div className="text-xs text-green-600 font-bold">Paid</div>
                    </div>
                    <div className="text-gray-400 font-bold">/</div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{paymentStats.unpaid}</div>
                      <div className="text-xs text-red-600 font-bold">Pending</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">Payment Status</div>
                </div>

                {/* Pending Amount */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-red-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-red-100 rounded-lg p-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-600 mb-1">{formatCurrency(paymentStats.unpaidAmount)}</div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Pending Amount</div>
                  {paymentStats.unpaid > 0 && (
                    <div className="text-xs text-red-500 mt-1 font-semibold bg-red-50 rounded-md px-1 py-0.5">
                      {paymentStats.unpaid} operator{paymentStats.unpaid !== 1 ? "s" : ""} pending
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-emerald-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-emerald-100 rounded-lg p-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-emerald-600 mb-1">{formatCurrency(filteredTotalGrand)}</div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Grand Total</div>
                  {searchTerm && (
                    <div className="text-xs text-gray-500 mt-1 font-semibold bg-gray-50 rounded-md px-1 py-0.5">
                      Full Total: {formatCurrency(totalGrand)}
                    </div>
                  )}
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-red-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-red-100 rounded-lg p-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-600 mb-1">{formatCurrency(totalExpenses)}</div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total Expenses</div>
                  {totalExpenses > 0 && (
                    <div className="text-xs text-red-500 mt-1 font-semibold bg-red-50 rounded-md px-1 py-0.5">
                      Deducted from pay
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-b-2 border-blue-200">
                      <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                        Pay
                      </th>
                      <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                        Code
                      </th>
                      <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                        Cost
                      </th>
                      <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                        Name
                      </th>
                      <th className="py-3 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                        Last Name
                      </th>
                      {weekdayKeys.map((day) => {
                        const dateStr = weekDates[day];
                        const displayDate = dateStr ? formatDateForHeader(dateStr) : day;
                        return (
                          <th
                            key={day}
                            className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wide text-xs border-l border-gray-200"
                          >
                            <div className="text-xs text-gray-500 font-semibold mb-1">{day}</div>
                            <div className="font-bold text-gray-800">{displayDate}</div>
                          </th>
                        );
                      })}
                      <th className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wide text-xs border-l-2 border-blue-300">
                        Additional Bonuses
                      </th>
                      <th className="py-3 px-4 text-center font-bold text-red-600 uppercase tracking-wide text-xs border-l border-gray-200">
                        Expenses
                      </th>
                      <th className="py-3 px-4 text-center font-bold text-blue-600 uppercase tracking-wide text-xs border-l border-gray-200">
                        📊 Total
                      </th>
                      <th className="py-3 px-4 text-center font-bold text-emerald-600 uppercase tracking-wide text-xs border-l border-gray-200">
                        💎 Grand Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOperators.length ? (
                      filteredOperators.map((r, index) => (
                        <tr
                          key={r.code}
                          className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 hover:shadow-md ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          onClick={() => setSelectedOperator(r)}
                        >
                          <td className="py-2 px-4 text-center">
                            {r.pay != null ? (
                              <span className="text-xl">✅</span>
                            ) : (
                              <span className="text-xl">⚠️</span>
                            )}
                          </td>
                          <td className="py-2 px-4 font-bold text-gray-800">{r.code}</td>
                          <td className="py-2 px-4 font-semibold text-gray-700">{formatCurrency(r.cost)}</td>
                          <td className="py-2 px-4 font-semibold text-gray-700">{r.name}</td>
                          <td className="py-2 px-4 font-semibold text-gray-700">{r.lastName}</td>
                          {weekdayKeys.map((day) => {
                            const value = r[day];
                            return (
                              <td key={day} className="py-2 px-4 text-center border-l border-gray-100">
                                {value ? (
                                  <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md text-sm">
                                    {formatCurrency(value)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 font-semibold">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 px-4 text-center font-bold text-blue-600 border-l-2 border-blue-200 bg-blue-50">
                            {formatCurrency(r.additionalBonuses || 0)}
                          </td>
                          <td className="py-2 px-4 text-center font-bold text-red-600 border-l border-gray-200">
                            {r.expense && r.expense > 0 ? (
                              <span className="bg-red-100 px-2 py-1 rounded-lg border border-red-200 text-sm">
                                -{formatCurrency(r.expense)}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-center font-bold text-blue-600 border-l border-gray-200 bg-blue-50">
                            {formatCurrency((r.total || 0) + (r.additionalBonuses || 0))}
                          </td>
                          <td className="py-2 px-4 text-center font-bold text-emerald-600 border-l border-gray-200 bg-emerald-50">
                            {formatCurrency(r.grandTotal || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={weekdayKeys.length + 9}
                          className="py-16 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                              <svg
                                className="w-10 h-10 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <p className="text-gray-500 font-bold text-xl">
                              {searchTerm
                                ? `No operators found matching "${searchTerm}"`
                                : "No data available"}
                            </p>
                            <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal */}
        {selectedOperator && weekInfo && (
          <PayrollModal
            isOpen={!!selectedOperator}
            onClose={handleModalClose}
            operatorData={{
              ...selectedOperator,
              expense: selectedOperator.expense || 0,
            }}
            periodStart={weekInfo.start_date}
            periodEnd={weekInfo.end_date}
            assignmentsByDay={selectedOperator.assignmentsByDay}
          />
        )}
      </div>
    </div>
  );
}

// ErrorBoundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 m-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-xl p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-red-800">Export Error</h3>
              <p className="text-red-600">{String(this.state.error)}</p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}