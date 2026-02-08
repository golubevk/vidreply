import { Entity, Column, Index } from "typeorm";

import { CommonEntity } from "@/common/entities/common.entity";
import { UserRole } from "../enums";

@Entity("users")
export class UserEntity extends CommonEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  @Index()
  email: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ name: "first_name", type: "varchar", length: 255 })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 255 })
  lastName: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  @Index()
  role: UserRole;

  @Column({ name: "last_login_at", type: "timestamp", nullable: true })
  lastLoginAt: Date | null;
}
