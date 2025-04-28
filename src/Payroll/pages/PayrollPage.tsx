"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, AlertTriangle, CheckCircle } from "lucide-react"
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';

interface Employee {
  id: number
  status: "warning" | "success"
  code: string
  cost: number
  name: string
  lastName: string
  monday: number
  tuesday: number
  wednesday: number
  thursday: number
  friday: number
  saturday: number
  sunday: number
  additionalBonus: number
  grandTotal: number
}

interface ApiResponse {
  status: string
  messDev: string
  messUser: string
  data: AssignmentData[]
  week_info: WeekInfo
  pagination: Pagination
}

interface AssignmentData {
  id_assign: number
  date: string
  code: string
  salary: number
  first_name: string
  last_name: string
  bonus: number | null
  role: string
}

interface WeekInfo {
  week_number: number
  year: number
  start_date: string
  end_date: string
}

interface Pagination {
  count: number
  next: string | null
  previous: string | null
  page_size: number
}

// Componente principal que maneja la página de nómina
const PayrollPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Función que obtiene los datos de pagos de la API
    const fetchPayments = async () => {
      try {
        // Función auxiliar para obtener el token de las cookies
        const getTokenFromCookies = () => {
          const cookies = document.cookie.split(';');
          const tokenCookie = cookies.find(cookie => 
            cookie.trim().startsWith('token=') || 
            cookie.trim().startsWith('access_token=')
          );
          return tokenCookie ? tokenCookie.split('=')[1].trim() : null;
        };

        const token = getTokenFromCookies();
        console.log('Todas las cookies:', document.cookie);
        console.log('Token encontrado:', token);
        
        const response = await fetch(`http://127.0.0.1:8000/api/assign/listAssignOperators?number_week=1&page=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Respuesta del servidor:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Error al cargar los datos: ${response.status} ${response.statusText}`);
        }

        const apiResponse: ApiResponse = await response.json();
        console.log('Datos recibidos:', apiResponse);
        
        setWeekInfo(apiResponse.week_info);
        
        // Transformar los datos de la API al formato que espera la tabla
        const transformedData: Employee[] = apiResponse.data.map(assignment => ({
          id: assignment.id_assign,
          status: assignment.bonus === null ? "warning" : "success",
          code: assignment.code,
          cost: assignment.salary,
          name: assignment.first_name,
          lastName: assignment.last_name,
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
          additionalBonus: assignment.bonus || 0,
          grandTotal: assignment.salary + (assignment.bonus || 0)
        }));

        setEmployees(transformedData);
        setIsLoading(false);
      } catch (err) {
        // Manejo de errores en la obtención de datos
        console.error('Error completo:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Definición de las columnas para la tabla de empleados
  const columns: MRT_ColumnDef<Employee>[] = [
    // Columna de estado que muestra un ícono según el estado del pago
    {
      accessorKey: 'status',
      header: 'Pay',
      Cell: ({ row }) => (
        row.original.status === "warning" ? (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )
      ),
      size: 50,
    },
    {
      accessorKey: 'code',
      header: 'Code',
      size: 80,
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      size: 80,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 120,
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
      size: 120,
    },
    {
      accessorKey: 'monday',
      header: 'Monday',
      Cell: ({ row }) => row.original.monday.toFixed(1),
      size: 100,
    },
    {
      accessorKey: 'tuesday',
      header: 'Tuesday',
      size: 100,
    },
    {
      accessorKey: 'wednesday',
      header: 'Wednesday',
      size: 100,
    },
    {
      accessorKey: 'thursday',
      header: 'Thursday',
      size: 100,
    },
    {
      accessorKey: 'friday',
      header: 'Friday',
      size: 100,
    },
    {
      accessorKey: 'saturday',
      header: 'Saturday',
      size: 100,
    },
    {
      accessorKey: 'sunday',
      header: 'Sunday',
      size: 100,
    },
    {
      accessorKey: 'additionalBonus',
      header: 'Additional Bonus',
      size: 120,
    },
    {
      accessorKey: 'grandTotal',
      header: 'Grand Total',
      size: 120,
    },
  ];

  // Configuración de la tabla utilizando Material React Table
  const table = useMaterialReactTable({
    columns,
    data: employees,
    state: {
      isLoading: isLoading,
    },
    // Configuraciones adicionales de la tabla como paginación, ordenamiento, etc.
    enableRowSelection: false,
    enableColumnFilters: false,
    enableGlobalFilter: true,
    enablePagination: true,
    enableSorting: true,
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: '#2563eb',
        color: 'white',
        fontWeight: 'bold',
      },
    },
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: row.original.status === "warning" ? '#FEF9C3' : '#DCFCE7',
      },
    }),
    muiTableBodyCellProps: {
      sx: {
        '&:not(:empty)': {
          backgroundColor: '#f0f9ff', // Color de fondo para celdas con contenido
        },
      },
    },
    initialState: {
      pagination: {
        pageSize: 15,
        pageIndex: 0  // Agregamos esta línea para corregir el error
      },
    },
    paginationDisplayMode: 'pages',
    positionPagination: 'bottom',
    muiPaginationProps: {
      rowsPerPageOptions: [15, 25, 50],
      showFirstButton: true,
      showLastButton: true,
    },
    renderTopToolbarCustomActions: () => null,
  });

  // Renderizado condicional en caso de error
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  // Renderizado del componente principal
  return (
    // Estructura del layout de la página incluyendo:
    // - Barra de búsqueda
    // - Selector de semana
    // - Información de la semana actual
    // - Tabla de empleados
    <div className="h-screen p-5">
      <div className="h-full">
        <div className="h-full flex flex-col">
          <div className="bg-blue-100 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search Code"
                  className="pl-10 pr-4 py-2 rounded-md border border-gray-300 w-60"
                  onChange={(e) => table.setGlobalFilter(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-blue-900">Week :</span>
                <div className="flex items-center gap-2">
                  <span>1/02/2024 - 7/04/2024</span>
                  <button className="text-blue-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">week -5</span>
              </div>

              <button className="bg-white text-blue-600 px-4 py-2 rounded-md flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
                Filtros
              </button>
            </div>
          </div>

          <div className="space-y-1 mb-4">
            <div className="flex">
              <div className="bg-blue-600 text-white font-semibold px-4 py-1 rounded-sm w-32 flex items-center">
                Week Number:
              </div>
              <div className="bg-blue-500 text-white px-4 py-1 rounded-sm w-32">
                {weekInfo?.week_number || '-'}
              </div>
            </div>
            <div className="flex">
              <div className="bg-blue-600 text-white font-semibold px-4 py-1 rounded-sm w-32 flex items-center">
                Period:
              </div>
              <div className="bg-blue-500 text-white px-4 py-1 rounded-sm w-auto">
                {weekInfo ? `${weekInfo.start_date} - ${weekInfo.end_date}` : '-'}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <MaterialReactTable table={table} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PayrollPage
