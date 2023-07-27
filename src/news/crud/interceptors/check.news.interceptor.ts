import { Injectable, NestInterceptor, ExecutionContext, CallHandler, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import {NewsCrudService} from "@src/news/crud/services";

@Injectable()
export class NewsCheckInterceptor implements NestInterceptor {
  constructor(private readonly newsService: NewsCrudService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const newsId = request.params.id;

    const news = await this.newsService.findById(newsId);
    if (!news) {
      throw new NotFoundException('News not found');
    }

    request.body.news = news;

    return next.handle();
  }
}
