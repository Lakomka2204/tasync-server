import { Account } from "src/account/account.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
@Entity('folders')
export class Folder {
    @PrimaryGeneratedColumn('increment')
    id: number;
    @Column()
    name: string;
    @ManyToOne(() => Account,account => account.folders,{onDelete:'CASCADE'})
    owner: Account;
    @Column({name:"is_public",default:false,type:'bool'})
    isPublic: boolean;
}
