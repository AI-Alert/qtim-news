import {Column, Entity, OneToOne} from "typeorm";
import {AbstractEntity} from "@shared/entities";
import {Exclude} from "class-transformer";
import {UserEntity} from "@src/entities";

@Entity( { name: 'userVerification' })
export class UserVerificationEntity extends AbstractEntity {
  @Column({ nullable: true })
  passwordVerificationCode?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  lastPasswordVerificationCodeSentAt?: Date;

  @Column({ nullable: true })
  emailVerificationCode?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  lastEmailVerificationCodeSentAt?: Date;

  @Column({ nullable: false, default: false })
  verifiedEmail: boolean;

  @OneToOne(
    () => UserEntity,
    (user: UserEntity) => user.verification,
  )
  @Exclude()
  user: UserEntity;
}
