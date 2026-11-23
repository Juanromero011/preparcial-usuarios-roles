import { type Ability, Policy, type PolicyBefore } from '@nestjs/authorization';
import { isAdmin, type User } from '../users/user.entity.js';

/**
 * Quién puede hacer qué con los roles.
 *
 * El guard llama primero before(): si devuelve true, pasa sin mirar la regla;
 * si devuelve undefined, decide la regla (el método con el nombre del @Can()).
 * Sin usuario la respuesta es 401; con usuario y regla en false, 403.
 */
@Policy()
export class RolesPolicy implements PolicyBefore<User, Ability<RolesPolicy>> {
  before(user: User | null) {
    if (isAdmin(user)) return true;
  }

  /** POST /roles: solo admin (lo deja pasar before). */
  create(_user: User | null): boolean {
    return false;
  }

  /** GET /roles: solo admin. */
  list(_user: User | null): boolean {
    return false;
  }
}
