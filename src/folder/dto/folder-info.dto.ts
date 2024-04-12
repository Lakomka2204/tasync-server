import { Exclude, Expose, Transform } from "class-transformer";
@Exclude()
export class FolderInfoDto {
    @Expose()
    id: number;
    @Expose()
    name: string;
    @Expose()
    isPublic: boolean;
}
