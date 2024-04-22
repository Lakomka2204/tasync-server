import { DataSourceOptions } from "typeorm";

export const dbSource: DataSourceOptions = {
    type: 'postgres',
    host:process.env.DB_HOST,
    port:+process.env.DB_PORT,
    username:process.env.DB_USER,
    password: process.env.DB_PASS,
    schema: process.env.DB_SCHEME,
    database: process.env.DB_DATABASE,
    entities: ['src/**/*.entity.ts'],
}
