import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {LikedNewsEntity, NewsEntity, UserEntity} from "@src/entities";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {NewsCrudController} from "@src/news/crud/controllers";
import {NewsCrudService} from "@src/news/crud/services";
import {UserModule} from "@src/user/user.module";
import {NewsCheckInterceptor} from "@src/news/crud/interceptors";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      NewsEntity,
      LikedNewsEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  controllers: [NewsCrudController],
  providers: [NewsCrudService, NewsCheckInterceptor],
})
export class NewsModule {}
