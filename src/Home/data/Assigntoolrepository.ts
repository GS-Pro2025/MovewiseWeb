import Cookies from 'js-cookie';

const BASE_URL_API = import.meta.env.VITE_URL_BASE || 'http://127.0.0.1:8000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToolByJob {
  id_tool: number;
  name: string;
  description: string | null;
  unit: string | null;
}

export interface AssignedTool {
  id_assign_tool: number;
  date: string;
  quantity: number;
  describe: string | null;
  key: string;           // UUID de la orden (order.key)
  id_tool: number;
  tool_name: string;
  tool_unit: string | null;
}

export interface AssignToolPayload {
  id_tool: number;
  key: string;           // UUID — order.id
  quantity: number;
  describe?: string;
  date: string;          // required by Django model — format YYYY-MM-DD
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Backend response shape for toolsByJob
interface ToolsByJobRaw {
  id: number;
  name: string;
  description?: string | null;
  unit?: string | null;
  job: number;
}

// Backend response shape for assignedTools
interface AssignedToolRaw {
  id_assign_tool: number;
  tool: { id: number; name: string; job: number };
  date: string;
  quantity: number | null;
  describe: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  results: T[];
  next: string | null;
  previous: string | null;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = Cookies.get('authToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No hay token de autenticación');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function handleAuthError(status: number) {
  if (status === 403 || status === 401) {
    Cookies.remove('authToken');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Error desconocido.';
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const AssignToolRepository = {

  /**
   * GET /toolsByJob/<job_id>/
   * Trae todas las herramientas disponibles para un tipo de trabajo.
   * Usar: order.job (number) — ej. 9 para "PACK"
   */
  async getToolsByJob(jobId: number): Promise<ApiResponse<ToolByJob[]>> {
    try {
      const response = await fetch(
        `${BASE_URL_API}/toolsByJob/${jobId}/`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      handleAuthError(response.status);

      if (!response.ok) {
        throw new Error(`Error fetching tools: ${response.statusText}`);
      }

      // Backend returns { count, results: [{id, name, job}, ...] }
      const json: PaginatedResponse<ToolsByJobRaw> = await response.json();
      const tools: ToolByJob[] = (json.results || []).map((t) => ({
        id_tool: t.id,
        name: t.name,
        description: t.description ?? null,
        unit: t.unit ?? null,
      }));

      return { status: 'success', data: tools };
    } catch (error: unknown) {
      return { status: 'error', message: extractMessage(error) || 'Error al obtener herramientas.' };
    }
  },

  /**
   * POST /assignTool/
   * Crea la asignación de una herramienta a una orden.
   * Body: { id_tool, key (UUID), quantity, describe? }
   */
  async assignTool(payload: AssignToolPayload): Promise<ApiResponse<AssignedTool>> {
    try {
      const response = await fetch(
        `${BASE_URL_API}/assignTool/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      handleAuthError(response.status);

      if (!response.ok) {
        // Parse Django validation errors e.g. { id_tool: ["..."], key: ["..."] }
        const errorBody = await response.json().catch(() => ({}));
        const firstError = Object.values(errorBody).flat().join(', ');
        throw new Error(firstError || `Error ${response.status}`);
      }

      // Django returns: { "success the tool has been assign to the order": { ...data } }
      const json = await response.json();
      const data: AssignedTool = json['success the tool has been assign to the order'] ?? json;

      return { status: 'success', data };
    } catch (error: unknown) {
      return { status: 'error', message: extractMessage(error) || 'Error al asignar herramienta.' };
    }
  },

  /**
   * GET /assignedTools/<key>/
   * Trae todas las herramientas ya asignadas a una orden específica.
   * Usar: order.key (UUID)
   */
  async getAssignedToolsByOrder(key: string): Promise<ApiResponse<AssignedTool[]>> {
    try {
      const response = await fetch(
        `${BASE_URL_API}/assignTool/order/${key}/`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      handleAuthError(response.status);

      if (!response.ok) {
        throw new Error(`Error fetching assigned tools: ${response.statusText}`);
      }

      // Backend returns { count, results: [{ id_assign_tool, tool: {id, name}, date, quantity, describe }] }
      const json: PaginatedResponse<AssignedToolRaw> = await response.json();
      const tools: AssignedTool[] = (json.results || []).map((a) => ({
        id_assign_tool: a.id_assign_tool,
        date: a.date,
        quantity: a.quantity ?? 0,
        describe: a.describe,
        key,
        id_tool: a.tool.id,
        tool_name: a.tool.name,
        tool_unit: null,
      }));

      return { status: 'success', data: tools };
    } catch (error: unknown) {
      return { status: 'error', message: extractMessage(error) || 'Error al obtener herramientas asignadas.' };
    }
  },
};