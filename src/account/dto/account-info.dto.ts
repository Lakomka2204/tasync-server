import { Exclude, Expose, Transform } from "class-transformer";
@Exclude()
export class AccountInfoDto {
    @Expose()
    id: number;
    @Expose()
    createdAt: Date;
    @Expose()
    email: string;
    @Expose()
    @Transform((f) => f?.value?.length)
    authorizedTokens: number;
}
