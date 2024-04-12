import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { JwtModule } from '@nestjs/jwt';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';

@Module({
    imports: [JwtModule, TypeOrmModule.forFeature([Account])],
    providers: [AccountService],
    controllers: [AccountController],
    exports: [TypeOrmModule, AccountService]
})
export class AccountModule { }
