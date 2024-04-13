import { IsAlphanumeric, IsBoolean, IsString } from "class-validator";

export class CreateFolderDto {
    @IsString()
    @IsAlphanumeric()
    name: string;
    @IsBoolean()
    isPublic?:boolean = false;
}
