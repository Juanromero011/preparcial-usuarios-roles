import type { User } from '../users/user.entity.js';

// Le dice al paquete qué tipo devuelve @CurrentUser(): nuestro User con sus roles.
declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: User;
  }
}
