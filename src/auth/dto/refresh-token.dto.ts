import { IsNotEmpty, IsString } from 'class-validator';

/** Body de /auth/refresh y /auth/logout. */
export class RefreshTokenDto {
  @IsString({ message: 'refreshToken es requerido' })
  @IsNotEmpty({ message: 'refreshToken es requerido' })
  refreshToken: string;
}
