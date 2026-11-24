import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  // Swagger en http://localhost:3000/api. Los campos de los DTOs los lee solo
  // el plugin de nest-cli.json (no hace falta @ApiProperty en cada campo).
  const config = new DocumentBuilder()
    .setTitle('Preparcial: usuarios y roles')
    .setDescription('Haz POST /auth/login (viene lleno con el admin): el token se pone solo en "Authorize".')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, () => SwaggerModule.createDocument(app, config), {
    swaggerOptions: {
      persistAuthorization: true, // el token sobrevive a recargar la página
      // Corre en el navegador: tras un login exitoso, pone el accessToken en "Authorize".
      // Solo evita copiar y pegar; las rutas siguen exigiendo token.
      responseInterceptor: (res: { url: string; status: number; body?: { accessToken?: string } }) => {
        if (res.url.endsWith('/auth/login') && res.status === 200 && res.body?.accessToken) {
          const ui = (globalThis as { ui?: { preauthorizeApiKey(name: string, value: string): void } }).ui;
          ui?.preauthorizeApiKey('bearer', res.body.accessToken);
        }
        return res;
      },
    },
  });

  await app.listen(Number(process.env.PORT ?? 3000));
}
await bootstrap();
