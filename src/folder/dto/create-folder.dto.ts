import { IsBoolean, IsString } from "class-validator";

export class CreateFolderDto {
    @IsString()
    name: string;
    @IsBoolean()
    isPublic?:boolean = false;
}
