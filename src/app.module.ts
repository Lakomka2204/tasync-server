import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler';
import { AccountModule } from './account/account.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account/account.entity';
import { FolderController } from './folder/folder.controller';
import { FolderService } from './folder/folder.service';
import { FolderModule } from './folder/folder.module';
import { Folder } from './folder/folder.entity';
import { APP_GUARD } from '@nestjs/core';
import { ProxyThrottlerGuard } from './proxy-throttler.guard';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal:true}),
        ThrottlerModule.forRoot([
            {
                ttl: minutes(2),
                limit: 30,
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
                entities: [Account,Folder],
            }),
        }),
        AccountModule,
        FolderModule,
    ],
    exports: [TypeOrmModule],
    providers:[
        {
            provide: APP_GUARD,
            useClass: ProxyThrottlerGuard
        }
    ]
})
export class AppModule { }
