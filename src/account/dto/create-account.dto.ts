import { IsEmail, IsStrongPassword } from 'class-validator';
import { AuthAccountDto } from './auth-account.dto';

export class CreateAccountDto extends AuthAccountDto {
    @IsEmail()
    email: string;
    @IsStrongPassword({ minLength: 8 })
    password: string;
}
