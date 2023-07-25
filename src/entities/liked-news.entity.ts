import {Column, Entity, Index, JoinColumn, ManyToOne} from "typeorm";
import {AbstractEntity} from "@shared/entities";
import {UserEntity, NewsEntity} from "@src/entities";


@Entity({ name: 'likedNews' })
export class LikedNewsEntity extends AbstractEntity {
  @Column()
  newsId: number;

  @Column()
  userId: number;

  @ManyToOne(
    () => UserEntity,
    (user: UserEntity) => user.likedNews,
    { eager: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' } )
  @Index()
  user: UserEntity;

  @ManyToOne(() => NewsEntity, (news: NewsEntity) => news.likedNews, { eager: true, nullable: false, onDelete: 'CASCADE' },)
  @JoinColumn({ name: 'newsId' })
  news: NewsEntity;
}
