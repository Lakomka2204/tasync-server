import { Exclude } from 'class-transformer';
import { Account } from '../account/account.entity';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
@Entity('folders')
export class Folder {
    @PrimaryGeneratedColumn('increment')
    id: number;
    @Column()
    name: string;
    @ManyToOne(() => Account, (account) => account.folders, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'owner_id' })
    owner: Account;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @Exclude()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
    @Exclude()
    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
    @Column({ array: true, type: 'bigint', default: [] })
    commits: string[];
    @Column({ array: true, type: 'text', default: [] })
    ignoreFiles: string[];
}
