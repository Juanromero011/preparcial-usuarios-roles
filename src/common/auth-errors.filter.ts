import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Los guards de @nestjs/authentication y @nestjs/authorization responden
 * 401 "Unauthorized" / 403 "Forbidden". Este filtro deja el código y cambia
 * el mensaje por el del enunciado:
 *   401 → "Token inválido o faltante"   403 → "No autorizado"
 *
 * Se aplica con @UseFilters(AuthErrorsFilter) en los controladores
 * protegidos (no en /auth, que tiene sus propios 401 como "Credenciales incorrectas").
 */
@Catch(HttpException)
export class AuthErrorsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    if (status === HttpStatus.UNAUTHORIZED) {
      response.status(status).json({ message: 'Token inválido o faltante', error: 'Unauthorized', statusCode: status });
    } else if (status === HttpStatus.FORBIDDEN) {
      response.status(status).json({ message: 'No autorizado', error: 'Forbidden', statusCode: status });
    } else {
      response.status(status).json(typeof body === 'string' ? { message: body, statusCode: status } : body);
    }
  }
}
