/**
 * Decodifica un token JWT y retorna el payload como objeto.
 * @param token JWT string
 * @returns El payload decodificado o null si el token es inválido
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}