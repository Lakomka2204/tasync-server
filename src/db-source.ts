import { config } from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
const entityExt = __dirname.endsWith("src") ? 'ts' : 'js';
if (entityExt == 'ts')
  config(); //! should be .env file with same creds but DB_HOST=localhost
export const dbSource: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  schema: process.env.DB_SCHEME,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '**', `*.entity.${entityExt}`)],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsRun: true
};
export const ds = new DataSource(dbSource);
