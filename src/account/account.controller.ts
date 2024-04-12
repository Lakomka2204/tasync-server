import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    MethodNotAllowedException,
    NotFoundException,
    ParseEnumPipe,
    Patch,
    Post,
    Put,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { AccountGuard } from './account.guard';
import { AccountInfoDto } from './dto/account-info.dto';
import { AccountService } from './account.service';
import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { CreateAccountDto } from './dto/create-account.dto';
import { AuthAccountDto } from './dto/auth-account.dto';
import { Throttle, ThrottlerGuard, minutes } from '@nestjs/throttler';
import { UpdateAccountDto } from './dto/update-account.dto';
import { isInt, isNumber, maxLength, minLength } from 'class-validator';
import { totp } from 'speakeasy';
import { Account } from './account.entity';
import { DelAccountDto } from './dto/delete-account.dto';
import { ProxyThrottlerGuard } from 'src/proxy-throttler.guard';

@Controller('account')
@UseGuards(ProxyThrottlerGuard)
export class AccountController {
    constructor(private readonly accountService: AccountService) { }
    @UseGuards(AccountGuard)
    @Get()
    async getAccountInfo(@Req() req: Request): Promise<AccountInfoDto> {
        const account: Account = JSON.parse(req.headers.authorization);
        return plainToClass(AccountInfoDto, account);
    }
    @UseGuards(AccountGuard)
    @Patch()
    async updateAccount(
        @Req() req: Request,
        @Body() updateAccountBody: UpdateAccountDto,
        @Res() res: Response,
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        const updated = await this.accountService.updateAccount(
            account.id,
            updateAccountBody,
        );
        if (updated < 0)
            throw new BadRequestException(
                'User with specified email already exists.',
            );
        const newToken = await this.accountService.createJwtToken(account.id);
        res.status(updated > 0 ? 200 : 304).json({ new_access_token: newToken });
    }
    @Patch("/delete")
    @UseGuards(AccountGuard)
    @HttpCode(200)
    async deleteAccount(@Req() req: Request, @Body() delAccountBody: DelAccountDto) {
        const account: Account = JSON.parse(req.headers.authorization);
        if (!await this.accountService.compare(delAccountBody.password, account.password))
            throw new UnauthorizedException("Password is invalid.");
        if (account.twoFaSecret) {
            if (!delAccountBody.code)
                throw new BadRequestException("2fa code is required.");
            if (!this.accountService.verifyTotp(account.twoFaSecret, delAccountBody.code))
                throw new UnauthorizedException("2fa code is invalid.");
        }
        await this.accountService.deleteAccount(account.id);
    }
    @Delete('/2fa')
    @HttpCode(200)
    @UseGuards(AccountGuard)
    async removeTwoFa(
        @Req() req: Request,
        @Query('code') totpCode: string,
    ): Promise<{ access_token: string }> {
        const account: Account = JSON.parse(req.headers.authorization);
        if (!account.twoFaSecret)
            throw new MethodNotAllowedException(
                'Your account does not have 2fa code',
            );
        console.log("code", totpCode, "isnumber", isNumber(totpCode), "isInt", isInt(totpCode))
        if (!totpCode || totpCode.length !== 6 || !parseInt(totpCode))
            throw new BadRequestException('No totp code.');
        const isRemoved = await this.accountService.remove2Fa(account, totpCode);
        if (!isRemoved) throw new BadRequestException('Wrong totp code.');
        return {
            access_token: await this.accountService.createJwtToken(account.id),
        };
    }
    @Throttle({ default: { ttl: minutes(1), limit: 10 } })
    @Get('/2fa')
    @HttpCode(200)
    @UseGuards(AccountGuard)
    async addTwoFa(
        @Req() req: Request,
        @Res() res: Response,
        @Query('type')
        type?: string,
        @Query('secret') secret?: string,
        @Query('code') code?: string,
    ) {
        const account: Account = JSON.parse(req.headers.authorization);
        if (account.twoFaSecret)
            throw new MethodNotAllowedException(
                'You already have 2fa authentication.',
            );
        if (secret && code) {
            if (!this.accountService.verifyTotp(secret, code))
                throw new BadRequestException("Wrong totp code.");
            await this.accountService.add2Fa(account, secret);
            return res.json({ access_token: await this.accountService.createJwtToken(account.id) });
        }
        const secretData = this.accountService.genSecret();
        switch (type) {
            case "qrcode":
                res.header('X-Secret', secretData.base32);
                return res.type('png').send(await this.accountService.generate2FaQrCode(secretData));
            case "text":
                return res.json({ secret: secretData.base32 });
            default:
                throw new BadRequestException("No type.");
        }
    }
    @Patch("/restore")
    @HttpCode(200)
    @UseGuards(AccountGuard)
    async restoreAccount() {

    }
    @HttpCode(200)
    @Post('/login')
    async login(
        @Body() accountBody: AuthAccountDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<{ access_token: string }> {
        const [token, account] = await this.accountService.getAuthToken(accountBody, true);
        if (token === undefined)
            throw new NotFoundException('Wrong email or password');
        else if (token === null)
            throw new ForbiddenException('2fa code is required.');
        if (account.deletedAt) {
            res.header("X-AccessToken", token);
            throw new UnauthorizedException("Account was deleted");
        }
        return { access_token: token };
    }
    @Throttle({ default: { ttl: minutes(1), limit: 3 } })
    @Put('/register')
    async register(
        @Body() accountBody: CreateAccountDto,
    ): Promise<{ access_token: string }> {
        const account = await this.accountService.createAccount(accountBody);
        if (!account)
            throw new BadRequestException(
                'User with specified email already exists.',
            );
        const [token] = await this.accountService.getAuthToken(accountBody);
        return { access_token: token };
    }
}
