import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/** Body: { roles: ["admin", "supervisor"] }. Reemplaza los roles que tenía el usuario. */
export class AssignRolesDto {
  @IsString({ each: true, message: 'roles inválidos' })
  @ArrayMaxSize(50, { message: 'roles inválidos' })
  @ArrayNotEmpty({ message: 'roles inválidos' })
  @IsArray({ message: 'roles inválidos' })
  roles: string[];
}
