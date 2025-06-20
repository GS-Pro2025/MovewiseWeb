/* eslint-disable @typescript-eslint/no-explicit-any */
import Cookies from "js-cookie";

export interface TokenInfo {
  exp: number;
  iat: number;
  person_id: number;
  company_id: number;
  email: string;
  is_admin: boolean;
  [key: string]: any; // Para permitir campos extra
}

export function getTokenInfo(): TokenInfo | null {
  const token = Cookies.get("authToken");
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    // Añade padding si es necesario
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const payload = JSON.parse(atob(padded));
    return payload as TokenInfo;
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}