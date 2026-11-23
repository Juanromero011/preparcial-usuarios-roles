import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/typeorm.config.js';

/**
 * Para el CLI de TypeORM (correr o revertir migraciones a mano):
 *   npm run build && npm run migration:run
 *   npm run migration:revert
 * Las variables las carga `node --env-file=.env` (ver package.json).
 */
export default new DataSource(buildDataSourceOptions());
