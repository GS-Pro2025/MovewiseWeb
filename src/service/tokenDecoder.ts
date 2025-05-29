/**
 * Decodifica un token JWT y retorna el payload como objeto.
 * @param token JWT string
 * @returns El payload decodificado o null si el token es inválido
 */
export function decodeJWTAsync(token: string): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    try {
      if (!token) return resolve(null);
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      resolve(JSON.parse(jsonPayload));
    } catch {
      resolve(null);
    }
  });
}