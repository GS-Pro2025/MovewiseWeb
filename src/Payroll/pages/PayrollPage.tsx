/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { payrollService, WeekInfo, getPaymentById } from "../../service/PayrollService";
import { PayrollModal } from "../components/PayrollModal";
import {
  fetchCountries,
  fetchStates,
  fetchCities,
} from "../../createOrder/repository/repositoryLocation";

// Imports de los nuevos módulos
import { 
  weekdayKeys, 
  LocationStep, 
  OperatorRow, 
  WeekAmounts, 
} from '../../models/payrroll';
import {
  getISOWeek, 
  generateWeekDates 
} from '../util/PayrollUtil';

// Componentes separados
import { PayrollHeader } from '../components/PayrollHeader';
import { PayrollControls } from '../components/PayrollControls';
import { PayrollStats } from '../components/PayrollStats';
import { PayrollTable } from '../components/PayrollTable';
import { PayrollError } from '../components/PayrollError';
import { PayrollLoading } from '../components/PayrollLoading';

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<OperatorRow[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<OperatorRow | null>(null);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [weekDates, setWeekDates] = useState<{
    [key in keyof WeekAmounts]?: string;
  }>({});
  const [week, setWeek] = useState(() => getISOWeek(new Date()));
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

        // Calcular totales
        const daysWorked = weekdayKeys.filter(
          (day) => row[day] != null && row[day]! > 0
        ).length;
        row.total = daysWorked * row.cost;
        // grandTotal ahora es el total SIN restar expense (total bruto)
        row.grandTotal = (row.total || 0) + (row.additionalBonuses || 0);
        // Agregar un nuevo campo para el total neto (después de descuentos)
        (row as any).netTotal = row.grandTotal - (row.expense || 0);

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

  // Total bruto (sin descuentos)
  const totalGrand = useMemo(
    () => grouped.reduce((sum, r) => sum + (r.grandTotal || 0), 0),
    [grouped]
  );
  
  // Total neto (con descuentos aplicados)
  const totalNet = useMemo(
    () => grouped.reduce((sum, r) => sum + ((r as any).netTotal || 0), 0),
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
  
  const filteredTotalNet = useMemo(
    () => filteredOperators.reduce((sum, r) => sum + ((r as any).netTotal || 0), 0),
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
      (sum, r) => sum + ((r as any).netTotal || 0),
      0
    );
    const unpaidAmount = unpaidOperators.reduce(
      (sum, r) => sum + ((r as any).netTotal || 0),
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

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">
        {/* Header Component */}
        <PayrollHeader />

        {/* Controls Component */}
        <PayrollControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          locationString={locationString}
          country={country}
          setCountry={setCountry}
          state={state}
          setState={setState}
          city={city}
          setCity={setCity}
          locationStep={locationStep}
          setLocationStep={setLocationStep}
          countries={countries}
          states={states}
          cities={cities}
          setCities={setCities}
          setStates={setStates}
          week={week}
          changeWeek={changeWeek}
          weekInfo={weekInfo}
          loading={loading}
          grouped={grouped}
          filteredOperators={filteredOperators}
          weekDates={weekDates}
          paymentStats={paymentStats}
          filteredTotalGrand={filteredTotalGrand}
        />

        {/* Error Component */}
        {error && <PayrollError error={error} />}

        {/* Loading or Content */}
        {loading ? (
          <PayrollLoading />
        ) : (
          <>
            {/* Stats Component */}
            <PayrollStats
              countDays={countDays}
              filteredOperators={filteredOperators}
              grouped={grouped}
              searchTerm={searchTerm}
              paymentStats={paymentStats}
              filteredTotalGrand={filteredTotalGrand}
              totalGrand={totalGrand}
              totalExpenses={totalExpenses}
              filteredTotalNet={filteredTotalNet}
              totalNet={totalNet}
            />

            {/* Table Component */}
            <PayrollTable
              filteredOperators={filteredOperators}
              weekDates={weekDates}
              searchTerm={searchTerm}
              onOperatorClick={setSelectedOperator}
            />
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
