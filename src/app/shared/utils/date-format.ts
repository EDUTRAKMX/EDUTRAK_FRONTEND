/** "Buenos días" / "Buenas tardes" / "Buenas noches" según la hora local. */
export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** "Jueves 8 de octubre" (formato del subtítulo de los frames de inicio). */
export function longDayLabel(date: Date): string {
  const text = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(date)
    .replace(',', '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Sep - Dic 2026" (nombre del periodo en la API) → "Sep–Dic 2026" (así lo muestra el topbar de Figma). */
export function compactTermName(name: string): string {
  return name.replace(/\s-\s/, '–');
}
