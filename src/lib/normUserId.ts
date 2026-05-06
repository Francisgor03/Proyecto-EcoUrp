/** Normaliza UUIDs / ids de usuario para usar como clave de mapa de forma estable. */
export function normUserId(id: unknown): string {
  if (id == null || id === "") return "";
  return String(id).trim().toLowerCase();
}
