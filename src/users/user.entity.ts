import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ADMIN_ROLE, Role } from '../roles/role.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // select: false → ningún find() trae el hash. Solo el login lo pide explícitamente.
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Dueño de la relación muchos a muchos: crea la tabla intermedia user_roles.
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}

/** Nombres de los roles del usuario, p. ej. ['admin', 'supervisor']. */
export const roleNames = (user: User): string[] => (user.roles ?? []).map((r) => r.role_name);

export const isAdmin = (user: User | null): boolean =>
  user !== null && roleNames(user).includes(ADMIN_ROLE);
