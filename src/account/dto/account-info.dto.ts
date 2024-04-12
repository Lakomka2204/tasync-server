import { Exclude, Expose } from "class-transformer";
@Exclude()
export class AccountInfoDto {
    @Expose()
    id: number;
    @Expose()
    createdAt: Date;
    @Expose()
    email: string;
    @Expose()
    username: string;
}
