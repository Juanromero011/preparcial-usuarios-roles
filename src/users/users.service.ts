import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors.js';
import { RolesService } from '../roles/roles.service.js';
import { roleNames, User } from './user.entity.js';

export interface NewUser {
  email: string;
  /** Ya hasheado. */
  password: string;
  name: string;
  phone?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly roles: RolesService,
  ) {}

  /** Emails sin espacios y en minúsculas: Ana@X.com y ana@x.com son la misma cuenta. */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async create(data: NewUser): Promise<User> {
    const email = this.normalizeEmail(data.email);
    if (await this.users.existsBy({ email })) throw new ConflictException('Email ya registrado');
    try {
      return await this.users.save(
        this.users.create({ email, password: data.password, name: data.name, phone: data.phone ?? null }),
      );
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Email ya registrado');
      throw error;
    }
  }

  /** Para el login: el único lugar que lee el hash (la columna tiene select: false). */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: this.normalizeEmail(email) })
      .getOne();
  }

  /** Para JwtAuthProvider: el usuario del token con sus roles. */
  findByIdWithRoles(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id }, relations: { roles: true } });
  }

  async getProfile(id: string) {
    const user = await this.findByIdWithRoles(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      roles: roleNames(user),
    };
  }

  async findAll() {
    try {
      const users = await this.users.find({
        relations: { roles: true },
        order: { created_at: 'ASC' },
      });
      return users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: roleNames(user),
      }));
    } catch {
      throw new InternalServerErrorException('Error al listar usuarios');
    }
  }

  /** Reemplaza los roles del usuario por los de la lista (todos deben existir). */
  async assignRoles(id: string, names: string[]) {
    const user = await this.findByIdWithRoles(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const unique = [...new Set(names.map((n) => n.trim()))];
    const roles = await this.roles.findByNames(unique);
    if (roles.length !== unique.length) throw new BadRequestException('roles inválidos');

    user.roles = roles;
    await this.users.save(user);
    return { message: 'Roles asignados' };
  }
}
