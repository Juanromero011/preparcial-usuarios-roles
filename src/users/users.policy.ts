import { type Ability, Policy, type PolicyBefore } from '@nestjs/authorization';
import { isAdmin, type User } from './user.entity.js';

/**
 * Quién puede hacer qué con los usuarios. Mismo patrón que RolesPolicy:
 * before() deja pasar al admin; las reglas deciden para los demás.
 *
 * Para una regla nueva (p. ej. que un supervisor liste usuarios):
 *   list(user: User | null) { return hasRole(user, 'supervisor'); }
 */
@Policy()
export class UsersPolicy implements PolicyBefore<User, Ability<UsersPolicy>> {
  before(user: User | null) {
    if (isAdmin(user)) return true;
  }

  /** GET /users: solo admin. */
  list(_user: User | null): boolean {
    return false;
  }

  /** PATCH /users/:id/roles: solo admin. */
  assignRoles(_user: User | null): boolean {
    return false;
  }

  /** DELETE /users/:id: solo admin. */
  remove(_user: User | null): boolean {
    return false;
  }
}
