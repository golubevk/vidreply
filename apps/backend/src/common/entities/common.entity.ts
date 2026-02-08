import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity()
export class CommonEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  setCreateAt(): void {
    if (!this.createdAt) this.createdAt = new Date();
  }

  @BeforeUpdate()
  setUpdateAt(): void {
    this.updatedAt = new Date();
  }
}
