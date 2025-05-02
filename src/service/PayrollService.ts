
import Cookies from "js-cookie";

export interface AssignmentData {
  id_assign: number;
  date: string;
  code: string;
  salary: number;
  first_name: string;
  last_name: string;
  bonus: number | null;
  role: string;
}

export interface WeekInfo {
  week_number: number;
  year: number;
  start_date: string;
  end_date: string;
}

export interface Pagination {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
}

export interface ApiResponse {
  status: string;
  messDev: string;
  messUser: string;
  data: AssignmentData[];
  week_info: WeekInfo;
  pagination: Pagination;
}


const API_BASE: string =
  import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";



/**
 * GET /assign/listAssignOperators
 * @param numberWeek — ISO week number (1–53).
 * @param page       — Page (starts at 1; default 1).
 * @returns          — Parsed JSON response.
 */
export async function payrollService(
  numberWeek: number,
  page: number = 1,
): Promise<ApiResponse> {
  const token: string | undefined = Cookies.get("authToken");
  const url = `${API_BASE}/list-assign-operator?number_week=${numberWeek}&page=${page}`;

  const res: Response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }

  return (await res.json()) as ApiResponse;
}
