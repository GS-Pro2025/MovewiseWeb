/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import React, { useState, useEffect, useMemo } from "react";
import PayrollPDFExport from "../util/PayrollPDFExport";
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

interface WeekAmounts {
  Mon?: number;
  Tue?: number;
  Wed?: number;
  Thu?: number;
  Fri?: number;
  Sat?: number;
  Sun?: number;
}

interface OperatorRow extends WeekAmounts {
  code: string;
  name: string;
  lastName: string;
  role: string;
  cost: number;
  pay?: string | null;
  total?: number;
  additionalBonuses: number;
  expense?: number;
  grandTotal?: number;
  assignmentIds: (number | string)[];
  paymentIds: (number | string)[];
  assignmentsByDay?: {
    [key in keyof WeekAmounts]?: {
      id: number | string;
      date: string;
      bonus?: number;
    }[];
  };
}

const weekdayKeys: (keyof WeekAmounts)[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

/** Devuelve el número de semana ISO para una fecha dada */
function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const yearStartDayNum = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() + 4 - yearStartDayNum);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Genera las fechas de la semana basado en la información de week_info */
function generateWeekDates(
  startDate: string,
  endDate: string
): { [key in keyof WeekAmounts]?: string } {
  const dates: { [key in keyof WeekAmounts]?: string } = {};

  // El startDate ya debería ser el lunes, usar directamente
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const monday = new Date(startYear, startMonth - 1, startDay);

  console.log("Fecha de inicio (lunes):", startDate);
  console.log("Fecha de fin (domingo):", endDate);

  // Generar fechas de lunes a domingo en orden
  const dayKeys: (keyof WeekAmounts)[] = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);

    const year = current.getFullYear();
    const month = (current.getMonth() + 1).toString().padStart(2, "0");
    const day = current.getDate().toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    dates[dayKeys[i]] = dateStr;
    console.log(`${dayKeys[i]}: ${dateStr}`);
  }

  console.log("Fechas generadas:", dates);
  return dates;
}

/** Formatear fecha para mostrar en header */
function formatDateForHeader(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) {
    return "--/--";
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    return "--/--";
  }
  const date = new Date(year, month - 1, day);

  const monthStr = (date.getMonth() + 1).toString().padStart(2, "0");
  const dayStr = date.getDate().toString().padStart(2, "0");

  return `${monthStr}/${dayStr}`;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n
  );

type LocationStep = "country" | "state" | "city";

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

  // NUEVO: Estados para país, estado y ciudad
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
      console.log("Datos recibidos:", response.data);

      // Generar mapeo de fechas para los encabezados
      const dates = generateWeekDates(
        response.week_info.start_date,
        response.week_info.end_date
      );
      setWeekDates(dates);

      const map = new Map<string, OperatorRow>();
      // NUEVO: Map para cachear payments y evitar llamadas duplicadas
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
            expense: 0, // INICIALIZAR expense
            grandTotal: 0,
            assignmentIds: [assignId],
            paymentIds: payId != null ? [payId] : [],
            assignmentsByDay: {},
            // Agrega un set temporal para controlar los días sumados
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
      console.log("Obteniendo expenses de payments...");
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
              console.log(`Payment ${paymentId}: expense = ${expense}`);
            })
            .catch(error => {
              console.error(`Error getting payment ${paymentId}:`, error);
              paymentCache.set(paymentId, 0); // Default a 0 si hay error
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
        console.log(`Operator ${operator.code}: total expense = ${totalExpense}`);
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

        console.log(
          `Mapeando días para ${row.name} ${row.lastName} (${row.code})`
        );
        console.log(`Bonus para ${row.code}: ${row.additionalBonuses}`);
        console.log(`Expense para ${row.code}: ${row.expense}`);

        // Para cada día de la semana, buscar si trabajó
        weekdayKeys.forEach((dayKey) => {
          const dateForThisDay = dates[dayKey];
          if (dateForThisDay) {
            const salary = findWorkDay(row.code, dateForThisDay);
            if (salary !== null) {
              row[dayKey] = salary;
              console.log(`  ${dayKey} (${dateForThisDay}): ${salary}`);
            }
          }
        });

        // Calcular totales - INCLUYENDO EXPENSE
        const daysWorked = weekdayKeys.filter(
          (day) => row[day] != null && row[day]! > 0
        ).length;
        row.total = daysWorked * row.cost;
        // NUEVO CÁLCULO: restar expense del grand total
        row.grandTotal = (row.total || 0) + (row.additionalBonuses || 0) - (row.expense || 0);

        console.log(
          `Total para ${row.code}: Días=${daysWorked}, Salario=${row.total}, Bonus=${row.additionalBonuses}, Expense=${row.expense}, Gran Total=${row.grandTotal}`
        );

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

    console.log(
      `Búsqueda: "${searchTerm}", Total: ${grouped.length}, Filtrados: ${filtered.length}`
    );
    return filtered;
  }, [grouped, searchTerm]);

  // Totales para los operadores filtrados
  const filteredTotalGrand = useMemo(
    () => filteredOperators.reduce((sum, r) => sum + (r.grandTotal || 0), 0),
    [filteredOperators]
  );

  // AGREGAR: Total de expenses para las estadísticas
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Operators Payroll
          </h1>
          <p className="text-gray-600">
            Manage and track operator payments efficiently
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          {/* Controles principales: búsqueda, location y semana */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Input */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="bg-emerald-50 rounded-lg p-3">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="searchInput"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Search Operators
                </label>
                <div className="relative">
                  <input
                    id="searchInput"
                    type="text"
                    placeholder="Search by code, name, or last name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="Clear search"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6m2 5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Location Input with Clear Button */}
            <div className="w-64">
              <div className="flex items-center gap-3">
                <div className="bg-purple-50 rounded-lg p-3">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-700">
                      Location
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
                        className="text-xs text-red-500 hover:text-red-700 transition-colors duration-200 flex items-center gap-1"
                        title="Clear location"
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
                          ></path>
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
                      // Manejar selección y limpieza aquí
                      if (newValue === null) {
                        // Si el usuario borra el input, retrocede un paso
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
                        // Selección normal
                        if (locationStep === "country") {
                          setCountry(newValue.country);
                        } else if (locationStep === "state") {
                          setState(newValue.name);
                        } else if (locationStep === "city") {
                          setCity(newValue);
                        }
                      }
                    }}
                    sx={{ width: "100%" }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={label}
                        placeholder={`Select ${label.toLowerCase()}`}
                        size="small"
                        sx={{ width: "100%" }}
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      getOptionLabel(option) === getOptionLabel(value)
                    }
                    disableClearable={false}
                    disabled={locationStep === "state" && !country}
                  />
                </div>
              </div>
              {/* Mostrar el string construido */}
              <div className="text-xs text-gray-500 mt-1">
                {locationString && `Selected: ${locationString}`}
              </div>
            </div>
            
            {/* Week Input */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <div>
                <label
                  htmlFor="weekInput"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Week Number
                </label>
                <input
                  id="weekInput"
                  type="number"
                  min="1"
                  max="53"
                  value={week}
                  onChange={changeWeek}
                  className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium text-center"
                />
              </div>
            </div>
          </div>

          {/* Periodo y exportar PDF centrados abajo */}
          <div className="flex flex-col items-center mt-8 gap-4">
            {weekInfo && (
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 rounded-lg p-3">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Period
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {weekInfo.start_date} → {weekInfo.end_date}
                  </div>
                </div>
              </div>
            )}
            {!loading && weekInfo && grouped.length > 0 && (
              <ErrorBoundary>
                <PayrollPDFExport
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
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-center"> {/* CAMBIAR a 6 columnas */}
                <div className="bg-white rounded-xl p-5 shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {countDays}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Working Days
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100 hover:shadow-lg transition-shadow duration-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {filteredOperators.length}
                    {filteredOperators.length !== grouped.length && (
                      <span className="text-xl text-gray-400">
                        {" "}
                        / {grouped.length}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {searchTerm ? "Filtered Operators" : "Total Operators"}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-md border border-orange-100 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {paymentStats.paid}
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        Paid
                      </div>
                    </div>
                    <div className="text-gray-400 font-bold">/</div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">
                        {paymentStats.unpaid}
                      </div>
                      <div className="text-xs text-red-600 font-medium">
                        Pending
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Payment Status
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-md border border-red-100 hover:shadow-lg transition-shadow duration-200">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {formatCurrency(paymentStats.unpaidAmount)}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Pending Amount
                    {paymentStats.unpaid > 0 && (
                      <div className="text-xs text-red-500 mt-1 font-medium">
                        {paymentStats.unpaid} operator
                        {paymentStats.unpaid !== 1 ? "s" : ""} pending
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-md border border-emerald-100 hover:shadow-lg transition-shadow duration-200">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    {formatCurrency(filteredTotalGrand)}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Grand Total
                    {searchTerm && (
                      <div className="text-xs text-gray-400 mt-1 font-medium">
                        Full Total: {formatCurrency(totalGrand)}
                      </div>
                    )}
                  </div>
                </div>

                {/* NUEVA CARD: Total Expenses */}
                <div className="bg-white rounded-xl p-5 shadow-md border border-red-100 hover:shadow-lg transition-shadow duration-200">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {formatCurrency(totalExpenses)}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Total Expenses
                    {totalExpenses > 0 && (
                      <div className="text-xs text-red-500 mt-1 font-medium">
                        Deducted from pay
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="py-2 px-4 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">
                        Pay
                      </th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">
                        Code
                      </th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">
                        Cost
                      </th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">
                        Name
                      </th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">
                        Last Name
                      </th>
                      {weekdayKeys.map((day) => {
                        const dateStr = weekDates[day];
                        const displayDate = dateStr
                          ? formatDateForHeader(dateStr)
                          : day;
                        return (
                          <th
                            key={day}
                            className="py-2 px-4 text-right font-semibold text-gray-700 uppercase tracking-wide text-xs border-l border-gray-200"
                          >
                            <div className="text-xs text-gray-500 font-medium">
                              {day}
                            </div>
                            <div className="font-bold">{displayDate}</div>
                          </th>
                        );
                      })}
                      <th className="py-4 px-6 text-right font-semibold text-gray-700 uppercase tracking-wide text-xs border-l-2 border-blue-200">
                        Additional Bonuses
                      </th>
                      {/* NUEVA COLUMNA EXPENSE */}
                      <th className="py-4 px-6 text-right font-semibold text-gray-700 uppercase tracking-wide text-xs border-l border-gray-200">
                        <div className="text-red-600">Expenses</div>
                      </th>
                      {/* NUEVA COLUMNA TOTAL (sin descontar expense) */}
                      <th className="py-4 px-6 text-right font-semibold text-gray-700 uppercase tracking-wide text-xs border-l border-gray-200">
                        Total
                      </th>
                      <th className="py-4 px-6 text-right font-semibold text-gray-700 uppercase tracking-wide text-xs border-l border-gray-200">
                        Grand Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOperators.length ? (
                      filteredOperators.map((r, index) => (
                        <tr
                          key={r.code}
                          className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                          onClick={() => setSelectedOperator(r)}
                        >
                          <td className="py-2 px-4 text-center">
                            {r.pay != null ? (
                              <span className="text-green-500 text-xl">✅</span>
                            ) : (
                              <span className="text-amber-500 text-xl">⚠️</span>
                            )}
                          </td>
                          <td className="py-2 px-4 font-semibold text-gray-800">
                            {r.code}
                          </td>
                          <td className="py-2 px-4 font-medium text-gray-700">
                            {formatCurrency(r.cost)}
                          </td>
                          <td className="py-2 px-4 font-medium text-gray-700">
                            {r.name}
                          </td>
                          <td className="py-2 px-4 font-medium text-gray-700">
                            {r.lastName}
                          </td>
                          {weekdayKeys.map((day) => {
                            const value = r[day];
                            return (
                              <td
                                key={day}
                                className="py-4 px-6 text-right border-l border-gray-200"
                              >
                                {value ? (
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(value)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 font-medium">
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 px-4 text-right font-semibold text-blue-600 border-l-2 border-blue-200">
                            {formatCurrency(r.additionalBonuses || 0)}
                          </td>
                          {/* NUEVA CELDA EXPENSE */}
                          <td className="py-2 px-4 text-right font-semibold text-red-600 border-l border-gray-200">
                            {r.expense && r.expense > 0 ? (
                              <span className="bg-red-50 px-2 py-1 rounded-lg">
                                -{formatCurrency(r.expense)}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">—</span>
                            )}
                          </td>
                          {/* NUEVA CELDA TOTAL (sin descontar expense) */}
                          <td className="py-2 px-4 text-right font-semibold text-blue-600 text-lg border-l border-gray-200">
                            {formatCurrency((r.total || 0) + (r.additionalBonuses || 0))}
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-emerald-600 text-lg border-l border-gray-200">
                            {formatCurrency(r.grandTotal || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={weekdayKeys.length + 9} 
                          className="py-12 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <svg
                              className="w-12 h-12 text-gray-300 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              ></path>
                            </svg>
                            <p className="text-gray-500 font-medium">
                              {searchTerm
                                ? `No operators found matching "${searchTerm}"`
                                : "No data available"}
                            </p>
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
              expense: selectedOperator.expense || 0, // ASEGURAR que expense se pase
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
//ErrorBoundary mientras se averigua por qué no funciona el PDF
// ...existing code...
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
        <div style={{ color: "red" }}>
          PDF Error: {String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}
