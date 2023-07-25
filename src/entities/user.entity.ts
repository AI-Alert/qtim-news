import {Column, Entity, Index, JoinColumn, OneToMany, OneToOne} from "typeorm";
import {AbstractEntity} from "@shared/entities";
import {Exclude} from "class-transformer";
import {Gender} from "@constants/user.constants";
import {UserVerificationEntity, NewsEntity, LikedNewsEntity} from "@src/entities";

@Entity({ name: 'user' })
export class UserEntity extends AbstractEntity {
  @Column({ unique: true })
  email: string;

  @Column( { nullable: true } )
  @Exclude()
  passwordHash?: string;

  @Column( { nullable: true } )
  @Exclude()
  passwordSalt?: string;

  @Column()
  @Exclude()
  lastPasswordResetDate: Date;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true, type: 'enum', enum: Gender })
  gender?: Gender;

  @Column({ nullable: true, type: 'int' })
  age?: number;

  @Column({ nullable: true, type: 'date' })
  dateOfBirth?: string;

  @OneToOne(
    () => UserVerificationEntity,
    (verification: UserVerificationEntity) => verification.user,
    { eager: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn()
  @Index()
  @Exclude()
  verification: UserVerificationEntity;

  @OneToMany(() => NewsEntity, (news) => news.author)
  news: NewsEntity[];

  @OneToMany(() => LikedNewsEntity, likedNews => likedNews.user)
  likedNews: LikedNewsEntity[];
}
