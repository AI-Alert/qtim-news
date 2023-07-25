import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import {ConfigModule, ConfigService} from "@nestjs/config/dist";
import config from "./config";
import {ThrottlerModule} from "@nestjs/throttler";
import {RedisModule} from "@liaoliaots/nestjs-redis";
import {TypeOrmModule} from "@nestjs/typeorm";
import { UserModule } from './user/user.module';
import {NewsModule} from "@src/news/news.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    AuthModule,
    UserModule,
    NewsModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const connection = configService.get('redis.connection');
        return {
          config: [
            { ...connection, namespace: configService.get('redis.jwtClient') },
            {
              ...connection,
              namespace: configService.get('redis.jwtRefreshClient'),
            },
          ],
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
