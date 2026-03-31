/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { payrollService, WeekInfo } from "../../service/PayrollService";
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
import { PayrollEmailDialog } from '../components/PayrollEmailDialog';
import { OperatorRowExtended } from '../types/payroll.types';

// Ya no necesitamos calcular horas, el salary ya viene calculado para tipo "hour"

/**
 * PayrollPage - Componente principal para la gestión de nóminas
 * 
 * Este componente maneja:
 * - Visualización de nóminas por semana y año
 * - Filtrado por ubicación (país, estado, ciudad)
 * - Búsqueda de operadores
 * - Cálculo de totales brutos y netos
 * - Gestión de bonos y gastos
 * - Soporte para salary_type: "day" y "hour"
 * - Envío de correos con detalles de pago
 */
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
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para país, estado y ciudad
  const [countries, setCountries] = useState<{ country: string }[]>([]);
  const [states, setStates] = useState<{ name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [locationStep, setLocationStep] = useState<LocationStep>("country");

  // Estado para el diálogo de envío de correo
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedOperatorForEmail, setSelectedOperatorForEmail] = useState<OperatorRowExtended | null>(null);

  /**
   * Effect: Cargar países al montar el componente
   */
  useEffect(() => {
    fetchCountries().then((countries) => {
      const formattedCountries = countries.map((c) => ({ country: c.name }));
      setCountries(formattedCountries);
    });
  }, []);

  /**
   * Effect: Cargar estados cuando cambia el país seleccionado
   */
  useEffect(() => {
    if (country) {
      fetchStates(country).then((fetchedStates) => {
        setStates(fetchedStates);
      });
      setState("");
      setCities([]);
      setCity("");
      setLocationStep("state");
    }
  }, [country]);

  /**
   * Effect: Cargar ciudades cuando cambia el estado seleccionado
   */
  useEffect(() => {
    if (country && state) {
      fetchCities(country, state).then((fetchedCities) => {
        setCities(fetchedCities);
      });
      setCity("");
      setLocationStep("city");
    }
  }, [state]);

  /**
   * Effect: Resetear filtros de ubicación cuando se borran campos
   */
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

  /**
   * Memo: Construir string de ubicación completo
   * @returns String con formato "País, Estado, Ciudad"
   */
  const locationString = useMemo(() => {
    if (!country) return "";
    let loc = country;
    if (state) loc += `, ${state}`;
    if (city) loc += `, ${city}`;
    console.log('📍 [LOCATION] String de ubicación construido:', loc);
    return loc;
  }, [country, state, city]);

  /**
   * fetchData - Método principal para obtener y procesar datos de nómina
   * 
   * Proceso:
   * 1. Obtiene datos raw del servicio de nómina
   * 2. Genera mapeo de fechas para la semana
   * 3. Agrupa datos por operador
   * 4. Calcula bonos únicos por día
   * 5. Calcula earnings por día según salary_type (day/hour)
   * 6. Obtiene gastos (expenses) de payments
   * 7. Calcula totales brutos y netos
   */
  const fetchData = async () => {
    try {
      setLoading(true);  
      const response = await payrollService(week, year, locationString);
      console.log('[RESPONSE] Datos recibidos del servicio:', response);
      // Generar mapeo de fechas para los encabezados
      const dates = generateWeekDates(response.week_info.start_date);
      setWeekDates(dates);

      const map = new Map<string, OperatorRow>();

      // PASO 1: Crear la estructura básica de cada operador y agrupar assignments por día
      // payment_expense, id_payment y payment_status vienen directamente en cada assignment
      response.data.forEach((d, index) => {
        if (index === 0) {
          console.log('👤 [SAMPLE] Ejemplo de registro raw:', d);
        }
        
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
            email: d.email,
            pay: payId ? payId.toString() : null,
            total: 0,
            additionalBonuses: 0,
            expense: d.payment_expense != null ? Number(d.payment_expense) : 0,
            grandTotal: 0,
            assignmentIds: [assignId],
            paymentIds: payId != null ? [payId] : [],
            draftPaymentId: d.payment_status === 'draft' && payId != null ? payId : null,
            paymentStatus: d.payment_status ?? null,
            paymentDescription: d.payment_description ?? null,
            assignmentsByDay: {},
            operator_phone: d.operator_phone,
            _bonusDaysAdded: new Set<string>(),
            _salaryType: d.salary_type,
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
            console.log(`💰 [BONUS] ${d.code} - ${dayKey}: +${d.bonus}`);
          }
          
          if (!ex.assignmentsByDay![dayKey]) ex.assignmentsByDay![dayKey] = [];
          ex.assignmentsByDay![dayKey]!.push({
            id: assignId,
            date: dataDate,
            bonus: Number(d.bonus) || 0,
            startTime: d.start_time,
            endTime: d.end_time,
            salary: d.salary,
            salaryType: d.salary_type,
          } as any);
        }
      });

      console.log(`✅ [STEP 1] Total de operadores únicos: ${map.size}`);

      // PASO 3: Calcular earnings por día según salary_type
      console.log('🔄 [STEP 3] Calculando earnings por día...');
      const operators = Array.from(map.values()).map((row) => {
        const salaryType = (row as any)._salaryType;
        delete (row as any)._bonusDaysAdded;
        delete (row as any)._salaryType;

        let totalEarnings = 0;

        weekdayKeys.forEach((dayKey) => {
          const assignments = row.assignmentsByDay?.[dayKey];
          
          if (assignments && assignments.length > 0) {
            if (salaryType === 'hour') {
              // MODO HOUR: Sumar los salaries de todas las órdenes del día
              let dailyEarnings = 0;
              
              assignments.forEach((assignment: any) => {
                const assignmentSalary = Number(assignment.salary) || 0;
                dailyEarnings += assignmentSalary;
                console.log(`💵 [ORDER] ${row.code} - ${dayKey} - Assignment ${assignment.id}: ${assignmentSalary}`);
              });
              
              row[dayKey] = dailyEarnings;
              totalEarnings += dailyEarnings;
              
              console.log(`💰 [DAILY HOUR] ${row.code} - ${dayKey}: ${assignments.length} órdenes = ${dailyEarnings.toFixed(2)}`);
            } else {
              // MODO DAY: Un solo pago por día (comportamiento original)
              const dailyEarnings = row.cost;
              row[dayKey] = dailyEarnings;
              totalEarnings += dailyEarnings;
              
              console.log(`💵 [DAILY DAY] ${row.code} - ${dayKey}: ${dailyEarnings}`);
            }
          }
        });

        // Calcular totales
        row.total = totalEarnings;
        row.grandTotal = (row.total || 0) + (row.additionalBonuses || 0);
        (row as any).netTotal = row.grandTotal - (row.expense || 0);

        const daysWorked = weekdayKeys.filter(
          (day) => row[day] != null && row[day]! > 0
        ).length;

        console.log(`📊 [TOTALS] ${row.code} (${salaryType}):`, {
          días: daysWorked,
          tarifa: salaryType === 'hour' ? `${row.cost}/hora` : `${row.cost}/día`,
          totalBase: row.total,
          bonos: row.additionalBonuses,
          bruto: row.grandTotal,
          gastos: row.expense,
          neto: (row as any).netTotal
        });

        return row;
      });

      console.log('✅ [COMPLETE] Datos procesados completamente');
      console.log('👥 [FINAL] Total de operadores procesados:', operators.length);

      setGrouped(operators);
      setWeekInfo(response.week_info);
      setError(null);
    } catch (e) {
      console.error('❌ [ERROR] Error en fetchData:', e);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, year, country, state, city]);

  /**
   * handleModalClose - Cierra el modal y refresca los datos
   */
  const handleModalClose = () => {
    console.log('🔒 [MODAL] Cerrando modal de operador');
    setSelectedOperator(null);
    fetchData();
  };

  /**
   * Memo: Total bruto (sin descuentos)
   */
  const totalGrand = useMemo(
    () => {
      const total = grouped.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
      console.log('💰 [TOTAL BRUTO] Total general bruto:', total);
      return total;
    },
    [grouped]
  );
  
  /**
   * Memo: Total neto (con descuentos aplicados)
   */
  const totalNet = useMemo(
    () => {
      const total = grouped.reduce((sum, r) => sum + ((r as any).netTotal || 0), 0);
      console.log('[TOTAL NETO] Total general neto:', total);
      return total;
    },
    [grouped]
  );
  
  /**
   * Memo: Conteo de días trabajados en la semana
   */
  const countDays = useMemo(
    () =>
      weekdayKeys.filter((day) => grouped.some((r) => r[day] != null)).length,
    [grouped]
  );

  /**
   * Memo: Filtrar operadores basado en el término de búsqueda
   * Busca en: código, nombre y apellido
   */
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

    console.log(`🔍 [SEARCH] Término: "${searchTerm}" | Resultados: ${filtered.length}/${grouped.length}`);
    return filtered;
  }, [grouped, searchTerm]);

  /**
   * Memo: Totales para los operadores filtrados (bruto)
   */
  const filteredTotalGrand = useMemo(
    () => filteredOperators.reduce((sum, r) => sum + (r.grandTotal || 0), 0),
    [filteredOperators]
  );
  
  /**
   * Memo: Totales para los operadores filtrados (neto)
   */
  const filteredTotalNet = useMemo(
    () => filteredOperators.reduce((sum, r) => sum + ((r as any).netTotal || 0), 0),
    [filteredOperators]
  );

  /**
   * Memo: Total de expenses para las estadísticas
   */
  const totalExpenses = useMemo(
    () => filteredOperators.reduce((sum, r) => sum + (r.expense || 0), 0),
    [filteredOperators]
  );

  /**
   * Memo: Estadísticas de pagos (pagados vs no pagados)
   */
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

    const stats = {
      paid: paidOperators.length,
      unpaid: unpaidOperators.length,
      total: paidOperators.length + unpaidOperators.length,
      paidAmount,
      unpaidAmount,
    };

    console.log('📊 [PAYMENT STATS] Estadísticas de pago:', stats);
    return stats;
  }, [filteredOperators]);

  /**
   * changeWeek - Maneja el cambio de semana
   * @param e - Evento de cambio del input
   */
  const changeWeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const w = parseInt(e.target.value, 10);
    if (!isNaN(w) && w >= 1 && w <= 53) {
      console.log('📅 [WEEK CHANGE] Nueva semana:', w);
      setWeek(w);
    }
  };

  /**
   * changeYear - Maneja el cambio de año
   * @param newYear - Nuevo año seleccionado
   */
  const changeYear = (newYear: number) => {
    if (Number.isInteger(newYear) && newYear >= 2020 && newYear <= new Date().getFullYear() + 2) {
      console.log('📅 [YEAR CHANGE] Nuevo año:', newYear);
      setYear(newYear);
    }
  };

  /**
   * handleCloseEmailDialog - Cierra el diálogo de envío de email
   */
  const handleCloseEmailDialog = () => {
    console.log('📧 [EMAIL] Cerrando diálogo de email');
    setEmailDialogOpen(false);
    setSelectedOperatorForEmail(null);
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
          year={year}
          changeYear={changeYear}
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
            cost: selectedOperator.cost,
            total: selectedOperator.total || 0,
            additionalBonuses: selectedOperator.additionalBonuses || 0, 
            assignmentIds: selectedOperator.assignmentIds || [], 
            paymentIds: selectedOperator.paymentIds || [],
            expense: selectedOperator.expense || 0,
            draftPaymentId: selectedOperator.draftPaymentId ?? null,
            paymentStatus: selectedOperator.paymentStatus ?? null,
            paymentDescription: selectedOperator.paymentDescription ?? null,
            operator_phone: selectedOperator.operator_phone || null,
          }}
          periodStart={weekInfo.start_date}
          periodEnd={weekInfo.end_date}
          weekDates={weekDates}
          assignmentsByDay={selectedOperator.assignmentsByDay}
        />
      )}

        {/* Email Dialog */}
        <PayrollEmailDialog
          open={emailDialogOpen}
          onClose={handleCloseEmailDialog}
          operator={selectedOperatorForEmail}
          weekInfo={weekInfo}
          weekDates={weekDates}
        />
      </div>
    </div>
  );
}