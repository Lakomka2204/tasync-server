import { Module } from '@nestjs/common';
import { ThrottlerModule, minutes } from '@nestjs/throttler';
import { AccountModule } from './account/account.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account/account.entity';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ThrottlerModule.forRoot([
            {
                ttl: minutes(2),
                limit: 50,
            }]),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.getOrThrow('DB_HOST'),
                username: config.getOrThrow('DB_USER'),
                password: config.getOrThrow('DB_PASS'),
                database: config.getOrThrow('DB_DATABASE'),
                schema: config.getOrThrow('DB_SCHEMA'),
                synchronize: config.get('NODE_ENV') == 'development',
                entities: [Account],
            }),
        }),
        AccountModule,
    ],
})
export class AppModule { }
