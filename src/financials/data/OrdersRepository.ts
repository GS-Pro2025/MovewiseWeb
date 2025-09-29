import { OrderSummary } from "../domain/OrderSummaryModel";
import Cookies from "js-cookie";

const BASE_URL_API = import.meta.env.VITE_URL_BASE || "http://127.0.0.1:8000";

export async function searchOrdersByKeyRefLike(keyref: string): Promise<OrderSummary[]> {
  const token = Cookies.get("authToken");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay token de autenticación");
  }

  const response = await fetch(
    `${BASE_URL_API}/orders-by-keyref-like/?keyref=${encodeURIComponent(keyref)}&page_size=100000`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 403) {
    Cookies.remove("authToken");
    window.location.href = "/login";
    throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
  }

  if (!response.ok) throw new Error("Error fetching orders by keyref");
  const data = await response.json();
  return data.results || [];
}