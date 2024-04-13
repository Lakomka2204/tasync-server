import { Folder } from 'src/folder/folder.entity';
import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'accounts' })
export class Account {
    @PrimaryGeneratedColumn('increment')
    id: number;
    @Column({ unique: true })
    email: string;
    @Column({nullable:true})
    username:string;
    @BeforeInsert()
    autoAssignUsername() {
        this.username = this.email.split('@')[0];
    }
    @OneToMany(() => Folder,folder => folder.owner,{nullable:true,onDelete:'CASCADE'})
    folders: Folder[];
    @Column()
    password: string;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
    @Column({ name: 'twofa_secret', nullable: true })
    twoFaSecret?: string;
}
