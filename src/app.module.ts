import { Module } from '@nestjs/common';
import { ThrottlerModule, minutes, seconds } from '@nestjs/throttler';
import { AccountModule } from './account/account.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account/account.entity';
import { FolderModule } from './folder/folder.module';
import { Folder } from './folder/folder.entity';
import { APP_GUARD } from '@nestjs/core';
import { ProxyThrottlerGuard } from './proxy-throttler.guard';
import { BullModule } from '@nestjs/bull';
import { ArchiveModule } from './archive/archive.module';
import { FsModule } from './fs/fs.module';
import { dbSource } from './db-source';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                ttl: minutes(2),
                limit: 30,
            }]),
            BullModule.forRoot({
                redis:{
                    host: process.env.REDIS_HOST,
                    port: +process.env.REDIS_PORT,
                },
                defaultJobOptions: {
                    removeOnComplete: true,
                    attempts:5,
                    removeOnFail:false,
                    timeout:seconds(30)
                }
            }),
        TypeOrmModule.forRoot(dbSource),
        AccountModule,
        FolderModule,
        ArchiveModule,
        FsModule
    ],
    exports: [TypeOrmModule],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ProxyThrottlerGuard
        }
    ]
})
export class AppModule { }
