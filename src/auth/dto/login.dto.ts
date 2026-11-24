import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Sin @IsEmail a propósito: un email mal escrito es solo otra credencial
// incorrecta (401), como pide el enunciado para el login.
export class LoginDto {
  // El example solo prellena el body en Swagger con el admin del seed (para probar rápido).
  @ApiProperty({ example: 'admin@preparcial.com' })
  @IsString({ message: 'email es requerido' })
  @IsNotEmpty({ message: 'email es requerido' })
  email: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString({ message: 'password es requerido' })
  @IsNotEmpty({ message: 'password es requerido' })
  password: string;
}
