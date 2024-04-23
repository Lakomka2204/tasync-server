import { IsAlphanumeric, IsString } from 'class-validator';

export class CreateFolderDto {
    @IsString()
    @IsAlphanumeric()
    name: string;
}
