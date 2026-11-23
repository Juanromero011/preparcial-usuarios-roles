import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { User } from '../users/user.entity.js';

/** Nombre del rol que pasa todas las policies (ver `before()` en las policies). */
export const ADMIN_ROLE = 'admin';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  role_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Lado inverso de la relación: la tabla intermedia la define User (@JoinTable).
  @ManyToMany('User', (user: User) => user.roles)
  users: User[];
}
