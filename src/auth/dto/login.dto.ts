import { IsNotEmpty, IsString } from 'class-validator';

// Sin @IsEmail a propósito: un email mal escrito es solo otra credencial
// incorrecta (401), como pide el enunciado para el login.
export class LoginDto {
  @IsString({ message: 'email es requerido' })
  @IsNotEmpty({ message: 'email es requerido' })
  email: string;

  @IsString({ message: 'password es requerido' })
  @IsNotEmpty({ message: 'password es requerido' })
  password: string;
}
