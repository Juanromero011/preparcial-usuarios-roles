-- Rol admin y usuario admin: lo mismo que la migración
-- src/database/migrations/1764000000001-SeedAdmin.ts
-- Credenciales: admin@preparcial.com / Admin123!  (se guarda solo el hash scrypt)

INSERT INTO "roles" ("role_name", "description")
VALUES ('admin', 'Administrador: acceso total');

INSERT INTO "users" ("email", "password", "name")
VALUES (
  'admin@preparcial.com',
  '$scrypt$ln=17,r=8,p=1$xPMuAx/lIrYSpA+1fiHKjQ$ZL7VmNb3gdJGxO08W3Hy+FVfIapZTbxJ/zRTmB0fOUY',
  'Administrador'
);

INSERT INTO "user_roles" ("user_id", "role_id")
SELECT u.id, r.id
FROM "users" u, "roles" r
WHERE u.email = 'admin@preparcial.com' AND r.role_name = 'admin';
