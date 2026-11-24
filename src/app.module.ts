import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule, type Duration } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import './auth/authentication-types.js';
import { buildDataSourceOptions } from './config/typeorm.config.js';
import { AuthModule } from './auth/auth.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { ParkingSpotsModule } from './parking-spots/parking-spots.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => buildDataSourceOptions(process.env),
    }),

    // 1º autenticación: su guard global exige un usuario en toda ruta sin @Public() → 401.
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accessToken: {
          key: config.getOrThrow<string>('JWT_SECRET'), // mínimo 32 bytes, o el arranque falla
          ttl: config.get<Duration>('JWT_EXPIRES_IN', '2m'),
        },
        refreshToken: {
          ttl: config.get<Duration>('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
        // Refresh tokens en memoria: se pierden al reiniciar la API (permitido por el enunciado).
        allowInMemoryStorage: true,
      }),
    }),
    // 2º autorización: su guard global evalúa los @Can() → 403 (o 401 sin usuario).
    // Una ruta sin @Can(), @Can.Anyone() ni @Public() queda denegada.
    AuthorizationModule.forRoot(),

    AuthModule,
    RolesModule,
    UsersModule,
    ReservationsModule,
    ParkingSpotsModule,
  ],
})
export class AppModule {}
