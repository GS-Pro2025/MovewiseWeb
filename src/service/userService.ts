import { UserProfile } from "../models/UserModels";
import Cookies from "js-cookie";

const API_BASE: string =
  import.meta.env.VITE_URL_BASE ?? "http://127.0.0.1:8000";

export async function fetchUserProfile(id: number): Promise<UserProfile> {
  const token: string | undefined = Cookies.get("authToken");
  const response = await fetch(`${API_BASE}/profile/${id}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  console.log(response);
  if (!response.ok) {
    throw new Error('Error al obtener el perfil de usuario');
  }

  return await response.json();
}