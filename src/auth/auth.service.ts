import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordHasher, RefreshTokenError, TokenService, type TokenPair } from '@nestjs/authentication';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  /** Crea el usuario SIN roles: los asigna un admin con PATCH /users/:id/roles. */
  async register(dto: RegisterDto) {
    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = await this.users.create({
      email: dto.email,
      password: passwordHash,
      name: dto.name,
      phone: dto.phone,
    });
    return { message: 'Usuario registrado con éxito', userId: user.id };
  }

  async login({ email, password }: LoginDto): Promise<TokenPair> {
    const found = await this.users.findByEmailWithPassword(email);

    // verify() recibe el hash aunque no haya usuario (compara contra uno falso):
    // así un email inexistente tarda lo mismo que una contraseña mala.
    const valid = await this.passwordHasher.verify(password, found?.password);
    if (!valid || !found) throw new UnauthorizedException('Credenciales incorrectas');

    // Se revisa DESPUÉS de la contraseña, para no revelar a cualquiera qué cuentas están desactivadas.
    if (!found.is_active) throw new HttpException('Usuario desactivado', HttpStatus.LOCKED);

    // Access token JWT (sub = id del usuario) + refresh token opaco, de un solo uso.
    return this.tokens.issue(found.id, { method: 'password' });
  }

  /** Rotación: el refresh token usado queda inválido y se entrega un par nuevo. */
  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      return await this.tokens.refresh(refreshToken);
    } catch (error) {
      // reason: 'invalid' | 'expired' | 'reused'. Si se reusa uno ya rotado,
      // el paquete revoca toda la familia (posible robo del token).
      if (error instanceof RefreshTokenError) {
        throw new UnauthorizedException('Refresh token inválido, ya usado o revocado');
      }
      throw error;
    }
  }

  /** Revoca la sesión de ese refresh token. No revela si el token existía (RFC 7009). */
  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revoke(refreshToken);
  }
}
