/** Escapa un campo CSV (comillas, comas y saltos de línea). */
export function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvField).join(',')).join('\r\n');
}

/**
 * Descarga un CSV generado en el navegador a partir de datos ya cargados (BOM UTF-8 para Excel).
 * No es una operación del backend: el contrato no ofrece exportaciones.
 */
export function downloadCsv(filename: string, rows: readonly (readonly string[])[]): void {
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
