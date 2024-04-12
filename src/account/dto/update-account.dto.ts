import { IsEmail, IsOptional, IsStrongPassword } from "class-validator";

export class UpdateAccountDto {
  @IsEmail()
  @IsOptional()
  email:string;
  @IsOptional()
  @IsStrongPassword()
  password:string;
}