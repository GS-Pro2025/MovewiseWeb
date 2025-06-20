/* eslint-disable @typescript-eslint/no-explicit-any */
import { RegisterRequestBody } from "../domain/registerAdminModels";
import Cookies from "js-cookie";
const BASE_URL_API = import.meta.env.VITE_URL_BASE || "http://127.0.0.1:8000";

export async function registerUser(
  data: RegisterRequestBody
): Promise<{ success: boolean; data?: unknown; errorMessage?: string }> {
  const token = Cookies.get("authToken");
  if (!token) {
    window.location.href = "/login";
    throw new Error("No hay token de autenticación");
  }

  try {
    const response = await fetch(`${BASE_URL_API}/register/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        errorMessage: responseData.messDev || "Error registering user",
      };
    }

    return { success: true, data: responseData };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error?.message || "An unexpected error occurred",
    };
  }
}