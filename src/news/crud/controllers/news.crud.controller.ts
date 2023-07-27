import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse, ApiOkResponse,
  ApiOperation, ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete, Get,
  HttpCode,
  HttpStatus,
  Param, Patch,
  Post, Query,
  Request,
  UseGuards, UseInterceptors
} from "@nestjs/common";
import {NewsCrudService} from "@src/news/crud/services";
import {UserCrudService} from "@src/user/crud/services";
import {JwtAuthUserGuardRedis} from "@src/auth/guards";
import {LikedNewsEntity, NewsEntity} from "@src/entities";
import {CreateNewsDto, ListNewsResponseDto, NewsParams, UpdateNewsDto} from "@src/news/crud/dto";
import {PaginationQuery} from "@shared/dto";
import {FindOptionsWhere} from "typeorm";
import {NewsStatuses} from "@shared/enums";
import {NewsCheckInterceptor} from "@src/news/crud/interceptors";

export const EXAMPLE_NEWS = {
  id: '123',
  title: 'Title 1',
  description: 'Description 1',
  importance: "REGULAR",
  deletedAt: null,
  likes: 0,
  status: 'ACTIVE',
};

@ApiTags('News CRUD')
@ApiInternalServerErrorResponse({
  description:
    'Returns when there is an internal server error. Also returns the error object.',
})
@Controller('news/crud')
export class NewsCrudController {
  constructor(
      private readonly _crudService: NewsCrudService,
      private readonly _userCrudService: UserCrudService) {
  }

  @Post('create')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create News",
  })
  @ApiOkResponse({
    description:
      'Returns the created news',
    content: {
      'application/json': {
        example: EXAMPLE_NEWS,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async createNews(
    @Body() createNewsDto: CreateNewsDto, @Request() req: any,
  ): Promise<NewsEntity> {
    return this._crudService.create(
      req.user,
      createNewsDto,
    );
  }

  @Post('/:id/like')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @UseInterceptors(NewsCheckInterceptor)
  @ApiOperation({
    summary: "Like post by Id",
  })
  @ApiOkResponse({
    description:
      'Registered user liked news',
    content: {
      'application/json': {
        example: EXAMPLE_NEWS,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async likeNews(@Request() req: any ): Promise<LikedNewsEntity> {
    return await this._crudService.likeNews(req.body, req.user.id);
  }

  @Delete('/:id/unlike')
  @UseGuards(JwtAuthUserGuardRedis)
  @UseInterceptors(NewsCheckInterceptor)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Unlike post by Id",
  })
  @ApiOkResponse({
    description:
      'Registered user liked news',
    content: {
      'application/json': {
        example: EXAMPLE_NEWS,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async unlikeNews(@Request() req: any ): Promise<LikedNewsEntity> {
    return await this._crudService.unLikeNews(req.body.news.id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Edit the news by Id",
  })
  @ApiOkResponse({
    description:
      'Returns the edited news',
    content: {
      'application/json': {
        example: EXAMPLE_NEWS,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Returns when a field has failed validation',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: ['desc must be a valid string'],
          error: 'Bad Request',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(NewsCheckInterceptor)
  async updateNews(
    @Param() params: NewsParams,
    @Body() updateNewsDto: UpdateNewsDto,
  ): Promise<NewsEntity> {
    return this._crudService.update(
      +params.id,
      updateNewsDto,
    );
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Archive the news by Id",
  })
  @ApiOkResponse({
    description:
      'Returns the archived news',
    content: {
      'application/json': {
        example: EXAMPLE_NEWS,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(NewsCheckInterceptor)
  async archiveNews(
    @Param() params: NewsParams,
    @Body() body: NewsEntity,
  ): Promise<NewsEntity> {
    return this._crudService.archive(
      +params.id,
      body
    );
  }

  @Patch('/:id/activate')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change news's status to active by Id",
  })
  @ApiOkResponse({
    description:
      'Returns the active news',
    content: {
      'application/json': {
        example: EXAMPLE_NEWS,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async unarchiveNews(
    @Param() params: NewsParams
  ): Promise<NewsEntity> {
    return this._crudService.activate(
      +params.id,
    );
  }

  @Get('/:id')
  @ApiOperation({
    summary: "Find the news by Id",
  })
  @ApiOkResponse({
    description:
      'Returns the news',
    content: {
      'application/json': {
        example: EXAMPLE_NEWS,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async findNewsById(
    @Param() params: NewsParams
  ): Promise<NewsEntity> {
    const where: FindOptionsWhere<NewsEntity> = {
      status: NewsStatuses.active
    }
    return this._crudService.findById(
      +params.id,
      where,
    );
  }

  @Get('/all/list')
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({
    summary: "Find list of news",
  })
  @ApiOkResponse({
    description:
      'Returns the news',
    content: {
      'application/json': {
        example: [EXAMPLE_NEWS],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async listNews(
    @Query() query: PaginationQuery
  ): Promise<ListNewsResponseDto> {
    return this._crudService.listNews(
      query.skip,
      query.limit
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthUserGuardRedis)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Unlike post by Id",
  })
  @ApiOkResponse({
    description:
      'Registered user liked news',
    content: {
      'application/json': {
        example: EXAMPLE_NEWS,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async deleteNews(@Param() params: NewsParams, @Request() req: any ): Promise<LikedNewsEntity> {
    return await this._crudService.softDelete(+params.id, req.user.id);
  }
}
