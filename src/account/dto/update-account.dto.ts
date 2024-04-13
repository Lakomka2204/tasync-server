import { IsEmail, IsOptional, IsString, IsStrongPassword } from "class-validator";

export class UpdateAccountDto {
    @IsEmail()
    @IsOptional()
    email: string;
    @IsOptional()
    @IsStrongPassword()
    password: string;
    @IsOptional()
    @IsString()
    username: string;
}
