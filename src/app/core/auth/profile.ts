import { UI_ROLE_LABEL, UiRole } from './role.model';
import { User } from '../../shared/models/user.model';

/** Datos de presentación del usuario en topbar y menú móvil. */
export interface Profile {
  readonly fullName: string;
  readonly roleLabel: string;
  readonly initials: string;
}

export function buildProfile(user: User, role: UiRole): Profile {
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  return { fullName, roleLabel: UI_ROLE_LABEL[role], initials: initialsOf(fullName) };
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}
