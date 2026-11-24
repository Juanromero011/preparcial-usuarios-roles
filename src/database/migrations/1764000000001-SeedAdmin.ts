import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea el rol admin y un usuario admin con ese rol.
 *
 * Credenciales de prueba: admin@preparcial.com / Admin123!
 * Se guarda solo el hash scrypt, generado con el PasswordHasher del paquete:
 *   node --input-type=module -e "import {PasswordHasher} from '@nestjs/authentication'; console.log(await new PasswordHasher().hash('Admin123!'))"
 */
export const ADMIN_EMAIL = 'admin@preparcial.com';
// Ids fijos: así el admin tiene los mismos ids en cualquier base, y una migración
// con datos copiados (npm run migration:snapshot) le funciona a cualquiera.
export const ADMIN_ROLE_ID = '00000000-0000-4000-8000-00000000a001';
export const ADMIN_USER_ID = '00000000-0000-4000-8000-00000000a002';
const ADMIN_PASSWORD_HASH =
  '$scrypt$ln=17,r=8,p=1$xPMuAx/lIrYSpA+1fiHKjQ$ZL7VmNb3gdJGxO08W3Hy+FVfIapZTbxJ/zRTmB0fOUY';

export class SeedAdmin1764000000001 implements MigrationInterface {
  name = 'SeedAdmin1764000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "roles" ("id", "role_name", "description") VALUES ($1, $2, $3)`,
      [ADMIN_ROLE_ID, 'admin', 'Administrador: acceso total'],
    );
    await queryRunner.query(
      `INSERT INTO "users" ("id", "email", "password", "name") VALUES ($1, $2, $3, $4)`,
      [ADMIN_USER_ID, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, 'Administrador'],
    );
    await queryRunner.query(
      `INSERT INTO "user_roles" ("user_id", "role_id") VALUES ($1, $2)`,
      [ADMIN_USER_ID, ADMIN_ROLE_ID],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [ADMIN_EMAIL]);
    await queryRunner.query(`DELETE FROM "roles" WHERE "role_name" = 'admin'`);
  }
}
