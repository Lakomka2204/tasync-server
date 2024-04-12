import { IsString, IsEmail, IsOptional, Length } from "class-validator";

export class AuthAccountDto {
  @IsEmail()
  email:string;
  @IsString()
  password:string;
  @IsOptional()
  @Length(6,6)
  code: string;
}