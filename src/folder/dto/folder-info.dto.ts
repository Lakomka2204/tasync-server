import { Exclude, Expose, Transform, Type } from "class-transformer";
import { Account } from "src/account/account.entity";
export class FolderInfoDto {
    @Expose()
    id: number;
    @Expose()
    name: string;
    @Expose()
    isPublic: boolean;
    @Expose({name:'owner'})
    @Type(() => Account)
    @Transform(({value}) => value.id)
    ownerId: number;
}
