import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AccountService } from './account.service';

@Injectable()
export class AccountGuard implements CanActivate {
    constructor(private readonly accountService: AccountService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req: Request = context.switchToHttp().getRequest();
        if (!req.headers.authorization) return false;
        const [bearer, token] = req.headers.authorization.split(' ');
        if (bearer != 'Bearer') return false;
        const account = await this.accountService.getByToken(token);
        if (!account) return false;
        req.headers.authorization = JSON.stringify(account);
        return true;
    }
}
