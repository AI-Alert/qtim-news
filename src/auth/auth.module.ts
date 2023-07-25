import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {PassportModule} from "@nestjs/passport";
import {UserEntity, UserVerificationEntity} from "@src/entities";
import {UserModule} from "@src/user/user.module";
import {JwtStrategy, LocalUserStrategy} from "@src/auth/strategies";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserVerificationEntity,
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
    PassportModule,
  ],
  providers: [
    LocalUserStrategy,
    JwtStrategy,
  ]
})
export class AuthModule {}
