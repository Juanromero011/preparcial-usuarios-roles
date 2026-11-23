import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// class-validator corre los decoradores de ABAJO hacia ARRIBA, y con
// stopAtFirstError se queda con el primer error. Por eso "es requerido"
// va al final: es lo primero que se revisa.
export class CreateRoleDto {
  @Matches(/^[a-z][a-z0-9_-]*$/, {
    message: 'role_name solo admite minúsculas, números, - y _',
  })
  @MaxLength(50, { message: 'role_name no puede tener más de 50 caracteres' })
  @IsNotEmpty({ message: 'role_name es requerido' })
  @IsString({ message: 'role_name es requerido' })
  role_name: string;

  @MaxLength(255, { message: 'description no puede tener más de 255 caracteres' })
  @IsString({ message: 'description debe ser texto' })
  @IsOptional()
  description?: string;
}
