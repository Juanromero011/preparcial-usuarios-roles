import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

/**
 * Pruebas e2e contra el Postgres real (docker compose up -d).
 * Cada corrida usa emails y nombres de rol únicos, así no hay que limpiar la base.
 */
process.loadEnvFile('.env');
const { AppModule } = await import('../src/app.module.js');
const { configureApp } = await import('../src/app.setup.js');

const ADMIN = { email: 'admin@preparcial.com', password: 'Admin123!' };
const run = Date.now().toString(36);
const userEmail = `user-${run}@test.com`;
const roleName = `supervisor-${run}`;

describe('API usuarios y roles (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let adminToken: string;
  let userId: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    const res = await http.post('/auth/login').send(ADMIN).expect(200);
    adminToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const asAdmin = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);
  const asUser = (req: request.Test) => req.set('Authorization', `Bearer ${userToken}`);

  describe('POST /auth/register', () => {
    it('201 crea el usuario sin roles', async () => {
      const res = await http
        .post('/auth/register')
        .send({ email: userEmail, password: 'Password1', name: 'Usuario', phone: '3001234567' })
        .expect(201);
      expect(res.body).toEqual({ message: 'Usuario registrado con éxito', userId: expect.any(String) });
      userId = res.body.userId;
    });

    it('400 Email inválido', async () => {
      const res = await http.post('/auth/register').send({ email: 'nope', password: 'Password1', name: 'X' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email inválido');
    });

    it('409 Email ya registrado (sin importar mayúsculas)', async () => {
      const res = await http
        .post('/auth/register')
        .send({ email: userEmail.toUpperCase(), password: 'Password1', name: 'X' });
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email ya registrado');
    });
  });

  describe('POST /auth/login', () => {
    it('200 entrega accessToken, refreshToken y expiresIn 120', async () => {
      const res = await http.post('/auth/login').send({ email: userEmail, password: 'Password1' }).expect(200);
      expect(res.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 120,
      });
      userToken = res.body.accessToken;
    });

    it('401 Credenciales incorrectas (contraseña mala o email inexistente)', async () => {
      for (const body of [
        { email: userEmail, password: 'Equivocada1' },
        { email: `nadie-${run}@test.com`, password: 'Password1' },
      ]) {
        const res = await http.post('/auth/login').send(body);
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Credenciales incorrectas');
      }
    });

    it('423 Usuario desactivado', async () => {
      const email = `inactivo-${run}@test.com`;
      await http.post('/auth/register').send({ email, password: 'Password1', name: 'Inactivo' }).expect(201);
      await app.get(DataSource).query(`UPDATE users SET is_active = false WHERE email = $1`, [email]);

      const res = await http.post('/auth/login').send({ email, password: 'Password1' });
      expect(res.status).toBe(423);
      expect(res.body.message).toBe('Usuario desactivado');
    });
  });

  describe('POST /auth/refresh y /auth/logout', () => {
    it('rota el refresh token: el usado deja de servir', async () => {
      const login = await http.post('/auth/login').send({ email: userEmail, password: 'Password1' });
      const first = login.body.refreshToken;

      const res = await http.post('/auth/refresh').send({ refreshToken: first }).expect(200);
      expect(res.body).toEqual({ accessToken: expect.any(String), refreshToken: expect.any(String), expiresIn: 120 });
      expect(res.body.refreshToken).not.toBe(first);

      await http.post('/auth/refresh').send({ refreshToken: first }).expect(401);
    });

    it('400 refreshToken es requerido', async () => {
      for (const path of ['/auth/refresh', '/auth/logout']) {
        const res = await http.post(path).send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('refreshToken es requerido');
      }
    });

    it('401 con un refresh token inventado', async () => {
      await http.post('/auth/refresh').send({ refreshToken: 'no-existe' }).expect(401);
    });

    it('204 logout revoca el refresh token', async () => {
      const login = await http.post('/auth/login').send({ email: userEmail, password: 'Password1' });
      await http.post('/auth/logout').send({ refreshToken: login.body.refreshToken }).expect(204);
      await http.post('/auth/refresh').send({ refreshToken: login.body.refreshToken }).expect(401);
    });
  });

  describe('/roles', () => {
    it('401 Token inválido o faltante', async () => {
      for (const req of [http.get('/roles'), http.get('/roles').set('Authorization', 'Bearer basura')]) {
        const res = await req;
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Token inválido o faltante');
      }
    });

    it('403 No autorizado para un usuario sin rol admin', async () => {
      const res = await asUser(http.get('/roles'));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('No autorizado');
      await asUser(http.post('/roles').send({ role_name: 'x' })).expect(403);
    });

    it('201 el admin crea un rol', async () => {
      const res = await asAdmin(http.post('/roles').send({ role_name: roleName, description: 'Prueba' })).expect(201);
      expect(res.body).toEqual({ message: 'Rol creado con éxito', roleId: expect.any(String) });
    });

    it('400 role_name es requerido', async () => {
      const res = await asAdmin(http.post('/roles').send({}));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('role_name es requerido');
    });

    it('409 role_name ya existe', async () => {
      const res = await asAdmin(http.post('/roles').send({ role_name: roleName }));
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('role_name ya existe');
    });

    it('200 el admin lista los roles', async () => {
      const res = await asAdmin(http.get('/roles')).expect(200);
      expect(res.body).toEqual(
        expect.arrayContaining([
          { id: expect.any(String), role_name: 'admin', description: expect.any(String) },
          { id: expect.any(String), role_name: roleName, description: 'Prueba' },
        ]),
      );
    });
  });

  describe('/users', () => {
    it('GET /users/me 200 sin password', async () => {
      const res = await asUser(http.get('/users/me')).expect(200);
      expect(res.body).toEqual({ id: userId, email: userEmail, name: 'Usuario', phone: '3001234567', roles: [] });
    });

    it('GET /users/me 401 sin token', async () => {
      const res = await http.get('/users/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token inválido o faltante');
    });

    it('PATCH /users/:id/roles 403 para un usuario sin rol admin', async () => {
      await asUser(http.patch(`/users/${userId}/roles`).send({ roles: [roleName] })).expect(403);
    });

    it('PATCH /users/:id/roles 200 asigna roles', async () => {
      const res = await asAdmin(http.patch(`/users/${userId}/roles`).send({ roles: [roleName] })).expect(200);
      expect(res.body).toEqual({ message: 'Roles asignados' });

      const me = await asUser(http.get('/users/me')).expect(200);
      expect(me.body.roles).toEqual([roleName]);
    });

    it('PATCH /users/:id/roles 400 roles inválidos', async () => {
      for (const roles of [['no-existe'], [], 'admin', [1]]) {
        const res = await asAdmin(http.patch(`/users/${userId}/roles`).send({ roles }));
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('roles inválidos');
      }
    });

    it('PATCH /users/:id/roles 404 Usuario no encontrado', async () => {
      for (const id of ['00000000-0000-0000-0000-000000000000', 'no-es-uuid']) {
        const res = await asAdmin(http.patch(`/users/${id}/roles`).send({ roles: [roleName] }));
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Usuario no encontrado');
      }
    });

    it('GET /users 200 para el admin, nunca con password', async () => {
      const res = await asAdmin(http.get('/users')).expect(200);
      const user = res.body.find((u: { id: string }) => u.id === userId);
      expect(user).toEqual({ id: userId, email: userEmail, name: 'Usuario', roles: [roleName] });
      expect(JSON.stringify(res.body)).not.toContain('password');
    });

    it('GET /users 403 para un usuario sin rol admin', async () => {
      const res = await asUser(http.get('/users'));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('No autorizado');
    });
  });
});
