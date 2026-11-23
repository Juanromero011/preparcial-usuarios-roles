import { BadRequestException, type INestApplication, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/** El primer mensaje de validación, p. ej. "Email inválido", como texto y no como arreglo. */
function firstMessage(errors: ValidationError[]): string {
  for (const error of errors) {
    const message = Object.values(error.constraints ?? {})[0] ?? firstMessage(error.children ?? []);
    if (message) return message;
  }
  return 'Datos inválidos';
}

/** Configuración global. La usan main.ts y las pruebas e2e. */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // quita campos que no están en el DTO
      forbidNonWhitelisted: true, // ...y responde 400 si los mandan
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => new BadRequestException(firstMessage(errors)),
    }),
  );
}
