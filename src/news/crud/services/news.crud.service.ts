import {BadRequestException, Injectable, NotFoundException} from "@nestjs/common";
import {LikedNewsEntity, NewsEntity, UserEntity} from "@src/entities";
import {InjectRepository} from "@nestjs/typeorm";
import {FindOptionsWhere, Repository} from "typeorm";
import {ListNewsResponseDto, UpdateNewsDto} from "@src/news/crud/dto";
import {NewsStatuses} from "@shared/enums";

@Injectable()
export class NewsCrudService {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly _newsRepository: Repository<NewsEntity>,
    @InjectRepository(LikedNewsEntity)
    private readonly _likedNewsRepository: Repository<LikedNewsEntity>,
  ) {
  }

  async create(user: UserEntity, updateNewsDto: UpdateNewsDto): Promise<NewsEntity> {
    const newNews = new NewsEntity();
    newNews.status = NewsStatuses.active;
    newNews.author = user;

    this._newsRepository.merge(newNews, updateNewsDto);

    return this._newsRepository.save(newNews);
  }

  async findById(id: number, params?: FindOptionsWhere<NewsEntity>,): Promise<NewsEntity> {
    return this._newsRepository.findOneBy({ id, ...params });
  }

  async likeNews(news: NewsEntity, currentUser: UserEntity): Promise<LikedNewsEntity> {
    const alreadyLiked = await this._checkIfAlreadyLiked(news.id, currentUser.id);
    if (alreadyLiked) {
      throw new BadRequestException('News already liked by the user');
    }

    const likedPost = new LikedNewsEntity();
    likedPost.news = news;
    likedPost.newsId = news.id;
    likedPost.user = currentUser;
    likedPost.userId = currentUser.id;

    await this.updateLikeNews(news.id)

    return this._likedNewsRepository.save(likedPost);
  }

  async unLikeNews(newsId: number, userId: number): Promise<any> {
    const alreadyLiked = await this._checkIfAlreadyLiked(newsId, userId);
    if (!alreadyLiked) {
      throw new BadRequestException('News not liked by the user');
    }

    await this.updateUnlikeNews(newsId)

    return this._likedNewsRepository.delete({newsId, userId});
  }

  async update(id: number, updateNewsDto: UpdateNewsDto): Promise<NewsEntity> {
    const news = await this._newsRepository.findOneBy( {id} );
    if (!news) throw new NotFoundException('News Not Found');

    this._newsRepository.merge(news, updateNewsDto);

    return this._newsRepository.save(news);
  }

  async archive(id: number): Promise<NewsEntity> {
    const news = await this._newsRepository.findOneBy( {id} );
    if (!news) throw new NotFoundException('News Not Found');

    this._newsRepository.merge(news, { status: NewsStatuses.archieved });

    return this._newsRepository.save(news);
  }

  async updateLikeNews(id: number): Promise<NewsEntity> {
    const news = await this._newsRepository.findOneBy( {id} );
    if (!news) throw new NotFoundException('News Not Found');

    news.likes++;

    return this._newsRepository.save(news);
  }

  async updateUnlikeNews(id: number): Promise<NewsEntity> {
    const news = await this._newsRepository.findOneBy( {id} );
    if (!news) throw new NotFoundException('News Not Found');

    news.likes--;

    return this._newsRepository.save(news);
  }

  async activate(id: number): Promise<NewsEntity> {
    const news = await this._newsRepository.findOneBy( {id} );
    if (!news) throw new NotFoundException('News Not Found');

    this._newsRepository.merge(news, { status: NewsStatuses.active });

    return this._newsRepository.save(news);
  }

  private async _checkIfAlreadyLiked(newsId: number, userId: number): Promise<boolean> {
    const likedPost = await this._likedNewsRepository.findOne({ where: { newsId: newsId, userId } });
    return !!likedPost;
  }

  async listNews(skip?: number, take?: number,): Promise<ListNewsResponseDto> {
    const [news, amount] = await this._newsRepository.findAndCount({skip, take, where: { status: NewsStatuses.active }});
    return {
      amount,
      items: news,
    }
  }

  async softDelete(id: number, currentUser: UserEntity): Promise<any> {
      const news = await this._newsRepository.findOneBy( {id} );
      if (!news) throw new NotFoundException('News Not Found');
      if (news.author.id !== currentUser.id) throw new BadRequestException('The current user is not the author of this news')
      if (news.status === NewsStatuses.deleted) throw new BadRequestException('This news is already deleted')


    this._newsRepository.merge(news, { status: NewsStatuses.deleted });

    return this._newsRepository.save(news);
  }
}
