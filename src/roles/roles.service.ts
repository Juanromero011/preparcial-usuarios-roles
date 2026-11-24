import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors.js';
import type { CreateRoleDto } from './dto/create-role.dto.js';
import { ADMIN_ROLE, Role } from './role.entity.js';

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

  /** El admin no se puede borrar (quedaría la API sin administrador); uno asignado tampoco. */
  async remove(id: string) {
    const role = await this.roles.findOne({ where: { id }, relations: { users: true } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role.role_name === ADMIN_ROLE) throw new BadRequestException('No se puede eliminar el rol admin');
    if (role.users.length > 0) throw new ConflictException('El rol está asignado a usuarios');
    await this.roles.delete(id);
    return { message: 'Rol eliminado' };
  }

  /** Los roles con esos nombres. Puede devolver menos si alguno no existe. */
  findByNames(names: string[]): Promise<Role[]> {
    return this.roles.findBy({ role_name: In(names) });
  }
}
