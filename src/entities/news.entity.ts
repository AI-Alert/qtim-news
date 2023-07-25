import {Column, Entity, Index, JoinColumn, ManyToOne, OneToMany} from "typeorm";
import {AbstractEntity} from "@shared/entities";
import {Exclude} from "class-transformer";
import {NewsImportanceStatuses, NewsStatuses} from "@shared/enums";
import {UserEntity, LikedNewsEntity} from "@src/entities";

@Entity({ name: 'news' })
export class NewsEntity extends AbstractEntity {
  @Column({ unique: false })
  title: string;

  @Column( { nullable: true } )
  @Exclude()
  description?: string;

  @Column( { nullable: true } )
  @Exclude()
  source?: string;

  @Column( { nullable: true } )
  @Exclude()
  link?: string;

  @Column( { nullable: false, default: 0 } )
  likes: number;

  @Column({ nullable: true, enum: NewsStatuses, default: 'ACTIVE' })
  status?: string;

  @Column({ nullable: true, enum: NewsImportanceStatuses, default: 'REGULAR' })
  importance?: string;

  @Column( { type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @ManyToOne(
    () => UserEntity,
    (author: UserEntity) => author.news,
    { eager: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn()
  @Index()
  author: UserEntity;

  @OneToMany(() => LikedNewsEntity, likedNews => likedNews.news)
  likedNews: LikedNewsEntity[];
}
