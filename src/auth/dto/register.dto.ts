import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Los decoradores corren de abajo hacia arriba: el de "requerido" va al final.
export class RegisterDto {
  @MaxLength(255, { message: 'Email inválido' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @MaxLength(72, { message: 'password no puede tener más de 72 caracteres' })
  @MinLength(8, { message: 'password debe tener al menos 8 caracteres' })
  @IsString({ message: 'password es requerido' })
  password: string;

  @MaxLength(100, { message: 'name no puede tener más de 100 caracteres' })
  @IsNotEmpty({ message: 'name es requerido' })
  @IsString({ message: 'name es requerido' })
  name: string;

  @MaxLength(30, { message: 'phone no puede tener más de 30 caracteres' })
  @IsString({ message: 'phone debe ser texto' })
  @IsOptional()
  phone?: string;
}
