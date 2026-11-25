import { AuthError } from '../../core/auth/auth.api';

/** Textos de usuario para los errores del puerto de autenticación (códigos del backend). */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.status === 401) return 'El número institucional o la contraseña son incorrectos.';
    if (error.status === 429) {
      const wait = error.retryAfter ? ` Inténtalo de nuevo en ${error.retryAfter} segundos.` : ' Inténtalo más tarde.';
      return `Demasiados intentos fallidos.${wait}`;
    }
  }
  return 'No fue posible iniciar sesión. Inténtalo de nuevo.';
}

export function changePasswordErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.status === 401) return 'La contraseña actual no es correcta.';
    if (error.code === 'same_password') return 'La nueva contraseña debe ser distinta de la actual.';
    if (error.code === 'weak_password') return 'La nueva contraseña no cumple los requisitos de longitud.';
    if (error.status === 422) return 'La nueva contraseña no es válida.';
  }
  return 'No fue posible cambiar la contraseña. Inténtalo de nuevo.';
}
