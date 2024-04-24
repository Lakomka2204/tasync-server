import { DataSource, DataSourceOptions } from 'typeorm';
import {config} from 'dotenv';
config();
export const dbSource: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    schema: process.env.DB_SCHEME,
    database: process.env.DB_DATABASE,
    entities: [process.env.TYPEORM_ENTITIES],
    migrations: [process.env.TYPEORM_MIGRATIONS],
    synchronize: process.env.NODE_ENV == 'development',
};
export const ds = new DataSource(dbSource);
