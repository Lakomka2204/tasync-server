import { DataSource, DataSourceOptions } from "typeorm";

export const dbSource: DataSourceOptions = {
    type: 'postgres',
    host:process.env.DB_HOST,
    port:+process.env.DB_PORT,
    username:process.env.DB_USER,
    password: process.env.DB_PASS,
    schema: process.env.DB_SCHEME,
    database: process.env.DB_DATABASE,
    entities: ['dist/**/*.entity.js'],
    migrationsRun:true,
    migrations: ['src/migrations/*'],
    synchronize: process.env.NODE_ENV == "development"
}
export const ds = new DataSource(dbSource);
