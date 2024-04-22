import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Account } from "./account.entity";
import { compare, hash } from 'bcrypt';
import { CreateAccountDto } from "./dto/create-account.dto";
import { AuthAccountDto } from "./dto/auth-account.dto";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateAccountDto } from "./dto/update-account.dto";
import * as speakeasy from 'speakeasy';
import * as QrCode from 'qrcode';
import { mkdir } from "fs/promises";
import { join } from "path";
@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(Account)
        private readonly accountRepo: Repository<Account>,
        private readonly jwtService: JwtService,
    ) { }
    async getByEmail(usernameOrEmail: string, withDeleted: boolean = false): Promise<Account | null> {
        return await this.accountRepo.findOne({ withDeleted, where: { email: usernameOrEmail } });
    }
    async getById(id: number, withDeleted: boolean = false): Promise<Account | null> {
        return await this.accountRepo.findOne({ withDeleted, where: { id } });
    }
    async hashPassword(plain: string): Promise<string> {
        return await hash(plain, 10);
    }
    async compare(plain: string, hashed: string): Promise<boolean> {
        return await compare(plain, hashed);
    }
    async createAccount(account: CreateAccountDto): Promise<Account | null> {
        const existAccount = await this.getByEmail(account.email, true);
        if (existAccount) return null;
        const dbAccount = this.accountRepo.create({
            ...account,
            password: await this.hashPassword(account.password)
        });
        await this.accountRepo.save(dbAccount);
        const userPath = join(process.env.TMP_FILE_STORAGE,dbAccount.username);
        await mkdir(userPath);
        return dbAccount;
    }
    async updateAccount(id: number, accountInfo: UpdateAccountDto): Promise<number> {
        if (accountInfo.email) {
            const existAccount = await this.getByEmail(accountInfo.email);
            if (existAccount) return -1;
        }
        return (await this.accountRepo.update({ id }, accountInfo)).affected;
    }
    genSecret() {
        return speakeasy.generateSecret({ issuer: "vkclone", name: "VkClone secret key", otpauth_url: true });
    }
    async generate2FaQrCode(secret: speakeasy.GeneratedSecret): Promise<Buffer> {
        return await QrCode.toBuffer(secret.otpauth_url);
    }
    async remove2Fa(account: Account, totpCode: string): Promise<boolean | null> {
        if (this.verifyTotp(account.twoFaSecret, totpCode))
            return (await this.accountRepo.update({ id: account.id }, { twoFaSecret: null })).affected > 0;
        return false;
    }
    async add2Fa(account: Account, secret: string): Promise<boolean> {
        return (await this.accountRepo.update({ id: account.id }, { twoFaSecret: secret })).affected > 0;
    }
    async deleteAccount(id: number) {
        return (await this.accountRepo.softDelete({ id })).affected;
    }
    async getByToken(token: string): Promise<Account | null> {
        try {
            if (!token) return null;
            const jwtClaims = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
                issuer: 'vkclone',
                audience: 'vkclone',
            });
            if (!jwtClaims.sub) return null;
            const account = await this.getById(jwtClaims.sub);
            const updatedAtSeconds = Math.floor(account.updatedAt.getTime() / 1000);
            if (+jwtClaims.iat < updatedAtSeconds) return null;
            return account;
        } catch {
            return null;
        }

    }
    async createJwtToken(id: number): Promise<string> {
        return await this.jwtService.signAsync({ sub: id }, {
            issuer: 'vkclone',
            audience: 'vkclone',
            secret: process.env.JWT_SECRET,
            expiresIn: "30d"
        });
    }
    verifyTotp(secret: string, totpCode: string): boolean {
        return speakeasy.totp.verify({ secret, token: totpCode, encoding: 'base32' });
    }
    async getAuthToken(authAccount: AuthAccountDto, withDeleted: boolean = false): Promise<[string | null | undefined, Account]> {
        const account = await this.getByEmail(authAccount.email, withDeleted);
        if (!account) return [undefined, null];
        if (!await compare(authAccount.password, account.password)) return [undefined, null];
        if (account.twoFaSecret && !account.deletedAt) {
            if (!authAccount.code) return null;
            if (!this.verifyTotp(account.twoFaSecret, authAccount.code)) return [null, null];
        }
        return [await this.createJwtToken(account.id), account];
    }
}
