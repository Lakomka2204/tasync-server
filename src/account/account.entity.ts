import { Exclude } from 'class-transformer';
import {
  AfterSoftRemove,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn('increment')
  id: number;
  @Column({ unique: true })
  email: string;
  @Column()
  @Exclude()
  password: string;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @Exclude()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
  @Exclude()
  @Column({ name: 'twofa_secret', nullable: true })
  twoFaSecret?: string;
}
