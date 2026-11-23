-- Usuarios y roles de prueba (entregable 2).
-- Correr DESPUÉS de las migraciones (o de 01 y 02):
--   docker exec -i preparcial_db psql -U preparcial -d preparcial_db < sql/03_usuarios_y_roles_de_prueba.sql
--
-- Todos los usuarios de prueba tienen la contraseña: Password1
-- Se puede correr varias veces: ON CONFLICT evita duplicados.

BEGIN;

-- Roles
INSERT INTO "roles" ("role_name", "description") VALUES
  ('supervisor', 'Supervisa a los usuarios'),
  ('usuario',    'Usuario básico')
ON CONFLICT ("role_name") DO NOTHING;

-- Usuarios (hash scrypt de "Password1", hecho con PasswordHasher)
INSERT INTO "users" ("email", "password", "name", "phone", "is_active") VALUES
  ('supervisor@preparcial.com', '$scrypt$ln=17,r=8,p=1$eympNUOolVIi8Xeu0I4yJw$D5VME66vHj1jGasENkgW3px6MQOuWj+mCbI4D6FdkkY', 'Sofía Supervisora', '3001112233', true),
  ('ana@preparcial.com',        '$scrypt$ln=17,r=8,p=1$eympNUOolVIi8Xeu0I4yJw$D5VME66vHj1jGasENkgW3px6MQOuWj+mCbI4D6FdkkY', 'Ana Usuaria',       NULL,         true),
  ('multi@preparcial.com',      '$scrypt$ln=17,r=8,p=1$eympNUOolVIi8Xeu0I4yJw$D5VME66vHj1jGasENkgW3px6MQOuWj+mCbI4D6FdkkY', 'Mateo Multirol',    '3004445566', true),
  ('sinrol@preparcial.com',     '$scrypt$ln=17,r=8,p=1$eympNUOolVIi8Xeu0I4yJw$D5VME66vHj1jGasENkgW3px6MQOuWj+mCbI4D6FdkkY', 'Sara Sin Rol',      NULL,         true),
  ('inactivo@preparcial.com',   '$scrypt$ln=17,r=8,p=1$eympNUOolVIi8Xeu0I4yJw$D5VME66vHj1jGasENkgW3px6MQOuWj+mCbI4D6FdkkY', 'Iván Inactivo',     NULL,         false)
ON CONFLICT ("email") DO NOTHING;

-- Asignaciones (muchos a muchos): Mateo tiene dos roles.
INSERT INTO "user_roles" ("user_id", "role_id")
SELECT u.id, r.id
FROM (VALUES
  ('supervisor@preparcial.com', 'supervisor'),
  ('ana@preparcial.com',        'usuario'),
  ('multi@preparcial.com',      'supervisor'),
  ('multi@preparcial.com',      'usuario'),
  ('inactivo@preparcial.com',   'usuario')
) AS a(email, role_name)
JOIN "users" u ON u.email = a.email
JOIN "roles" r ON r.role_name = a.role_name
ON CONFLICT DO NOTHING;

COMMIT;

-- ── Consultas de verificación ─────────────────────────────────────────────

-- Cada usuario con sus roles (los sin rol salen con un arreglo vacío).
SELECT u.email, u.name, u.is_active,
       COALESCE(array_agg(r.role_name ORDER BY r.role_name) FILTER (WHERE r.id IS NOT NULL), '{}') AS roles
FROM "users" u
LEFT JOIN "user_roles" ur ON ur.user_id = u.id
LEFT JOIN "roles" r ON r.id = ur.role_id
GROUP BY u.id
ORDER BY u.created_at;

-- Cuántos usuarios tiene cada rol.
SELECT r.role_name, COUNT(ur.user_id) AS usuarios
FROM "roles" r
LEFT JOIN "user_roles" ur ON ur.role_id = r.id
GROUP BY r.id
ORDER BY r.role_name;
