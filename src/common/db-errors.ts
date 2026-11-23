import { QueryFailedError } from 'typeorm';

/** Postgres 23505: se violó una restricción UNIQUE (email o role_name repetido). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === '23505'
  );
}
