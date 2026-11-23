import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Crea las tablas users, roles y la intermedia user_roles (muchos a muchos). */
export class CreateUsersAndRoles1764000000000 implements MigrationInterface {
  name = 'CreateUsersAndRoles1764000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         uuid         NOT NULL DEFAULT gen_random_uuid(),
        "email"      varchar(255) NOT NULL,
        "password"   varchar(255) NOT NULL,
        "name"       varchar(100),
        "phone"      varchar(30),
        "is_active"  boolean      NOT NULL DEFAULT true,
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )`);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"          uuid         NOT NULL DEFAULT gen_random_uuid(),
        "role_name"   varchar(50)  NOT NULL,
        "description" varchar(255),
        "created_at"  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_role_name" UNIQUE ("role_name")
      )`);

    // Si se borra un usuario o un rol, sus asignaciones se borran con él.
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_user_roles_role" ON "user_roles" ("role_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
