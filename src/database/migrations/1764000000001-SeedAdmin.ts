import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea el rol admin y un usuario admin con ese rol.
 *
 * Credenciales de prueba: admin@preparcial.com / Admin123!
 * Se guarda solo el hash scrypt, generado con el PasswordHasher del paquete:
 *   node --input-type=module -e "import {PasswordHasher} from '@nestjs/authentication'; console.log(await new PasswordHasher().hash('Admin123!'))"
 */
export const ADMIN_EMAIL = 'admin@preparcial.com';
const ADMIN_PASSWORD_HASH =
  '$scrypt$ln=17,r=8,p=1$xPMuAx/lIrYSpA+1fiHKjQ$ZL7VmNb3gdJGxO08W3Hy+FVfIapZTbxJ/zRTmB0fOUY';

export class SeedAdmin1764000000001 implements MigrationInterface {
  name = 'SeedAdmin1764000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "roles" ("role_name", "description") VALUES ($1, $2)`,
      ['admin', 'Administrador: acceso total'],
    );
    await queryRunner.query(
      `INSERT INTO "users" ("email", "password", "name") VALUES ($1, $2, $3)`,
      [ADMIN_EMAIL, ADMIN_PASSWORD_HASH, 'Administrador'],
    );
    await queryRunner.query(
      `INSERT INTO "user_roles" ("user_id", "role_id")
       SELECT u.id, r.id FROM "users" u, "roles" r
       WHERE u.email = $1 AND r.role_name = 'admin'`,
      [ADMIN_EMAIL],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [ADMIN_EMAIL]);
    await queryRunner.query(`DELETE FROM "roles" WHERE "role_name" = 'admin'`);
  }
}
