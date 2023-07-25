import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserEntity, UserVerificationEntity} from "@src/entities";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {UserAuthService} from "@src/user/auth/services";
import {UserAuthController} from "@src/user/auth/controllers";
import {UserEmailUniqueValidator} from "@src/user/validators";
import {UserCrudController} from "@src/user/crud/controllers";
import {UserCrudService} from "@src/user/crud/services";

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
  ],
  controllers: [UserAuthController, UserCrudController],
  providers: [UserAuthService, UserEmailUniqueValidator, UserCrudService],
  exports: [UserAuthService, UserCrudService]
})
export class UserModule {}
