import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors.js';
import type { CreateRoleDto } from './dto/create-role.dto.js';
import { Role } from './role.entity.js';

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private readonly roles: Repository<Role>) {}

  async create(dto: CreateRoleDto) {
    if (await this.roles.existsBy({ role_name: dto.role_name })) {
      throw new ConflictException('role_name ya existe');
    }
    try {
      const role = await this.roles.save(
        this.roles.create({ role_name: dto.role_name, description: dto.description ?? null }),
      );
      return { message: 'Rol creado con éxito', roleId: role.id };
    } catch (error) {
      // Dos peticiones a la vez pueden pasar el existsBy: la restricción UNIQUE decide.
      if (isUniqueViolation(error)) throw new ConflictException('role_name ya existe');
      throw error;
    }
  }

  async findAll() {
    try {
      const roles = await this.roles.find({ order: { role_name: 'ASC' } });
      return roles.map(({ id, role_name, description }) => ({ id, role_name, description }));
    } catch {
      throw new InternalServerErrorException('Error al obtener roles');
    }
  }

  /** Los roles con esos nombres. Puede devolver menos si alguno no existe. */
  findByNames(names: string[]): Promise<Role[]> {
    return this.roles.findBy({ role_name: In(names) });
  }
}
