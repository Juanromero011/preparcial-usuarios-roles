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
    .setDescription('Haz login, copia el accessToken y pégalo en "Authorize".')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, () => SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true }, // el token sobrevive a recargar la página
  });

  await app.listen(Number(process.env.PORT ?? 3000));
}
await bootstrap();
