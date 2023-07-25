import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {RedisService} from "@liaoliaots/nestjs-redis";
import {JwtService} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";
import {Redis} from "ioredis";
import {UserEntity, UserVerificationEntity} from "@src/entities";
import {
  CreatePasswordDto,
  EmailDto,
  RegisterDto,
  RegisterResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto
} from "@src/user/auth/dto";
import {UserCrudService} from "@src/user/crud/services";
import {TokenPair} from "@constants/auth.constant";
import {UserTypes} from "@shared/enums";
import {compareHash, generateHash, generateVerificationCode} from "@shared/utils";


@Injectable()
export class UserAuthService {
  private readonly _logger = new Logger(UserAuthService.name);

  constructor(
    @InjectRepository(UserVerificationEntity)
    private readonly _verificationRepository: Repository<UserVerificationEntity>,
    private readonly _redisService: RedisService,
    private readonly _crudService: UserCrudService,
    private readonly _jwtService: JwtService,
    private readonly _config: ConfigService,
  ) {
    this._jwtClient = this._redisService.getClient(
      this._config.get('redis.jwtClient'),
    );

    this._jwtRefreshClient = this._redisService.getClient(
      this._config.get('redis.jwtRefreshClient'),
    );
  }

  private readonly _jwtClient: Redis;
  private readonly _jwtRefreshClient: Redis;

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {

    const existedUser = await this._crudService.findByEmail(registerDto.email);
    if (existedUser) {
      throw new HttpException('User with this email already registered in the system', 400);
    }

    const user: any = await this._crudService.create(registerDto);

    if (user.isPasswordSet !== undefined) {
      return user;
    }

    const {email, verificationCode} = await this.sendVerificationCode({ email: registerDto.email });

    return { id: user.id, email, verificationCode };
  }

  async sendVerificationCode(
    sendVerificationCodeDto: EmailDto,
  ): Promise<VerifyEmailResponseDto> {
    const user = await this._crudService.findByEmail(
      sendVerificationCodeDto.email,
    );
    if (!user) {
      throw new NotFoundException('User Not found');
    }

    const ONE_MINUTE = 60000;
    const timeSinceLastRefresh =
      Date.now() -
      user.verification.lastEmailVerificationCodeSentAt?.getTime() ?? 0;
    if (timeSinceLastRefresh < ONE_MINUTE) {
      throw new HttpException(`You can send another verification code only after ${(ONE_MINUTE - timeSinceLastRefresh) / 1000 } seconds`, 429);
    }

    try {
      const emailVerificationCode = generateVerificationCode();
      await this._verificationRepository.update(
        { id: user.verification.id },
        { emailVerificationCode, lastEmailVerificationCodeSentAt: new Date() },
      );

      return {
        email: sendVerificationCodeDto.email, verificationCode: emailVerificationCode,
      };
    } catch (error) {
      this._logger.error(error, error.stack);
      throw new InternalServerErrorException(error);
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<any | string> {
    const user = await this._crudService.findByEmail(verifyEmailDto.email);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    if (user.verification.verifiedEmail) {
      return 'Your email is already verified'
    }
    if (user.verification.emailVerificationCode !== verifyEmailDto.verificationCode) {
      throw new HttpException('Wrong verification code', 401);
    }

    return await this._verificationRepository.update(
      { id: user.verification.id },
      {
        verifiedEmail: true,
        emailVerificationCode: null,
        lastEmailVerificationCodeSentAt: null,
      },
    );
  }

  async checkTokenExpiration(accessToken: string): Promise<boolean> {
    const payload: any = this._jwtService.decode(accessToken);
    const user = await this._crudService.findByEmail(payload.username);

    if (!user) {
      throw new UnauthorizedException();
    }

    const lastResetMs = user.lastPasswordResetDate.getTime();
    const tokenIssuedMs = payload.iat * 1000;

    return tokenIssuedMs > lastResetMs;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    const user = await this._crudService.findByEmail(email);
    if (!user) {
      return null;
    }

    if (!user.verification.verifiedEmail) {
      throw new HttpException('Email is unverified',403);
    }

    if (!user.passwordHash) {
      return null;
    }

    const passwordCorrect = await compareHash(password, user.passwordHash);

    if (passwordCorrect) {
      return user;
    }

    return null;
  }

  async createPassword(
    createPasswordDto: CreatePasswordDto,
  ): Promise<TokenPair> {
    const user = await this._crudService.findByEmail(
      createPasswordDto.email,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.verification.verifiedEmail) {
      throw new HttpException('Email is unverified',403);
    }
    if (user.passwordHash !== null) {
      throw new HttpException('Password is already set',409);
    }

    const passwordHash = await generateHash(createPasswordDto.password);

    await this._crudService.update(user.id, {
      passwordHash,
      passwordSalt: 'test',
    });

    return this.login(user.email, createPasswordDto.password);
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.validateUser(email, password)
    const payload = { username: user.email, id: user.id };

    const accessToken = this._jwtService.sign(payload);
    const refreshToken = this._jwtService.sign({
      ...payload,
      createdAt: user.createdAt,
    });

    const tokenPair = { refreshToken, accessToken };
    const accessResponse = await this._jwtClient.setex(
      `${UserTypes.user}:${accessToken}`,
      this._config.get('redis.expiresInSeconds'),
      refreshToken,
    );

    const refreshResponse = await this._jwtRefreshClient.setex(
      `${UserTypes.user}:${refreshToken}`,
      this._config.get('redis.refreshExpiresInSeconds'),
      accessToken,
    );

    const eitherFailed = accessResponse !== 'OK' || refreshResponse !== 'OK';

    if (eitherFailed) {
      throw new Error(
        `User storeSession(): unable to set ${user.id}`,
      );
    }

    return tokenPair;
  }

  async refresh(refreshToken: string): Promise<{ message: string }> {
    const payload: any = await this._jwtService.verify(refreshToken);

    if (!payload.createdAt) {
      throw new UnauthorizedException('Not a refresh token!');
    }

    const accessToken = await this._jwtRefreshClient.get(
      `${UserTypes.user}:${refreshToken}`,
    );

    if (!accessToken) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.logout(accessToken);
  }

  async logout(accessToken: string): Promise<{ message: string }> {
    const refreshToken = await this._jwtRefreshClient.get(
      `${UserTypes.user}:${accessToken}`,
    );

    await this._jwtClient.del(`${UserTypes.user}:${accessToken}`);
    await this._jwtRefreshClient.del(`${UserTypes.user}:${refreshToken}`);

    return {
      "message": "You logout successfully",
    }
  }
}
