/** Fecha de hoy (YYYY-MM-DD) en hora de Chile, no UTC: de noche no cambia de día antes de tiempo. */
export function fechaHoy(desplazarDias = 0): string {
  const d = new Date(Date.now() + desplazarDias * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(d);
}
