import { Exclude, Expose, Transform, TransformFnParams, Type } from "class-transformer";
import { Account } from "src/account/account.entity";
@Exclude()
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
    @Expose({name:'commits'})
    @Type(() => Number)
    @Transform(({ value }: TransformFnParams) => {
        if (!Array.isArray(value) || value.length == 0)
            return null;
        return value[value.length - 1];
    })
    lastCommit: number | null;
}
