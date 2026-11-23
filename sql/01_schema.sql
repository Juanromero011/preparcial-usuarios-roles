-- Esquema de la base: lo mismo que la migración
-- src/database/migrations/1764000000000-CreateUsersAndRoles.ts
-- La API lo crea sola al arrancar (migrationsRun: true). Este archivo es para
-- revisarlo o correrlo a mano en una base vacía:
--   docker exec -i preparcial_db psql -U preparcial -d preparcial_db < sql/01_schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
);

CREATE TABLE "roles" (
  "id"          uuid         NOT NULL DEFAULT gen_random_uuid(),
  "role_name"   varchar(50)  NOT NULL,
  "description" varchar(255),
  "created_at"  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_roles_role_name" UNIQUE ("role_name")
);

-- Tabla intermedia de la relación muchos a muchos.
CREATE TABLE "user_roles" (
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id"),
  CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
);
CREATE INDEX "IDX_user_roles_role" ON "user_roles" ("role_id");
