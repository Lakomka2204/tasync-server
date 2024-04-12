import { IsOptional, IsString, Length } from "class-validator";

export class DelAccountDto {
    @IsString()
    password: string;
    @Length(6, 6)
    @IsOptional()
    code: string;
}
