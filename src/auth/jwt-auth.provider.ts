import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import { UsersService } from '../users/users.service.js';
import type { User } from '../users/user.entity.js';

/**
 * Lee `Authorization: Bearer <jwt>`, verifica la firma y la expiración con
 * la configuración `accessToken` del módulo, y carga el usuario CON SUS ROLES
 * (las policies los necesitan).
 *
 * Devolver null rechaza el token → 401. Pasa si el usuario ya no existe o si
 * fue desactivado después de iniciar sesión.
 */
@Injectable()
export class JwtAuthProvider extends JwtBearerProvider<User> {
  constructor(
    private readonly users: UsersService,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  async validate({ sub }: JwtClaims): Promise<User | null> {
    if (!sub) return null;
    const user = await this.users.findByIdWithRoles(sub);
    return user?.is_active ? user : null;
  }
}
