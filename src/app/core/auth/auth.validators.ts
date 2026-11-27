import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Reglas del backend (openapi.yaml `LoginRequest`; internal/identity/domain: MinPasswordLen = 10, máx. 128 bytes). */
export const INSTITUTIONAL_NUMBER_PATTERN = /^[0-9]{8}$/;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_BYTES = 128;

export type PasswordRuleViolation = 'tooShort' | 'tooLong';

/** Función pura (también la usa el mock para responder 422 `weak_password` como el backend). */
export function passwordRuleViolation(password: string): PasswordRuleViolation | null {
  if (password.length < PASSWORD_MIN_LENGTH) return 'tooShort';
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return 'tooLong';
  return null;
}

export function institutionalNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (value === '') return null; // `required` se encarga del vacío
    return INSTITUTIONAL_NUMBER_PATTERN.test(value) ? null : { institutionalNumber: true };
  };
}

/** Nueva contraseña: 10 caracteres como mínimo y 128 bytes como máximo (el backend responde 422 `weak_password`). */
export function newPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (value === '') return null;
    const violation = passwordRuleViolation(value);
    return violation ? { [violation]: true } : null;
  };
}

/**
 * Validador de grupo para el cambio de contraseña:
 *  - `mismatch`: confirmación distinta de la nueva (solo UX del cliente).
 *  - `samePassword`: el backend rechaza una nueva contraseña igual a la actual (422 `same_password`).
 */
export function passwordChangeGroupValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const current = group.get('current_password')?.value as string | undefined;
    const next = group.get('new_password')?.value as string | undefined;
    const confirm = group.get('confirm_password')?.value as string | undefined;
    const errors: ValidationErrors = {};
    if (next && confirm && next !== confirm) errors['mismatch'] = true;
    if (current && next && current === next) errors['samePassword'] = true;
    return Object.keys(errors).length ? errors : null;
  };
}
