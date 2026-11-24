-- Rol admin y usuario admin: lo mismo que la migración
-- src/database/migrations/1764000000001-SeedAdmin.ts
-- Credenciales: admin@preparcial.com / Admin123!  (se guarda solo el hash scrypt)

INSERT INTO "roles" ("id", "role_name", "description")
VALUES ('00000000-0000-4000-8000-00000000a001', 'admin', 'Administrador: acceso total');

INSERT INTO "users" ("id", "email", "password", "name")
VALUES (
  '00000000-0000-4000-8000-00000000a002',
  'admin@preparcial.com',
  '$scrypt$ln=17,r=8,p=1$xPMuAx/lIrYSpA+1fiHKjQ$ZL7VmNb3gdJGxO08W3Hy+FVfIapZTbxJ/zRTmB0fOUY',
  'Administrador'
);

INSERT INTO "user_roles" ("user_id", "role_id")
VALUES ('00000000-0000-4000-8000-00000000a002', '00000000-0000-4000-8000-00000000a001');
