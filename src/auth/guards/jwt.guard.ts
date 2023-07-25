import {ExecutionContext, Injectable} from "@nestjs/common";
import {AuthGuardType} from "@constants/auth.constant";
import {AuthGuard} from "@nestjs/passport";
import {UserTypes} from "@shared/enums/user.types";
import {RedisService} from "@liaoliaots/nestjs-redis";
import {ConfigService} from "@nestjs/config";
import {Reflector} from "@nestjs/core";
import {JwtService} from "@nestjs/jwt";
import {UserAuthService} from "@src/user/auth/services";

@Injectable()
export class JwtAuthGuard extends AuthGuard(AuthGuardType.Jwt) {}

@Injectable()
export class JwtAuthGuardRedis extends AuthGuard(AuthGuardType.Jwt) {
  protected role = UserTypes.user;

  constructor(
    private readonly _redisService: RedisService,
    private readonly _config: ConfigService,
    private readonly _reflector: Reflector,
    private readonly _jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // Проверка на "публичность" эндпоинта
    const superActivate = await super.canActivate(context);
    if (!superActivate) return false;

    // Проверка на "публичность" эндпоинта
    const isPublic = this._reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization.split(' ')[1];

    const payload: any = this._jwtService.decode(token);
    if (payload.createdAt) return false;

    const cacheToken = await this._redisService.getClient(this._config.get('redis.jwtClient')).get(`${this.role}:${token}`);

    return cacheToken && this.checkTokenExpiration(token)
  }
  protected async checkTokenExpiration(_accessToken: string) {
    return true;
  }
}

@Injectable()
export class JwtAuthUserGuardRedis extends JwtAuthGuardRedis {
  constructor(
    redisService: RedisService,
    config: ConfigService,
    reflector: Reflector,
    jwtService: JwtService,
    private readonly _userAuthService: UserAuthService,
  ) {
    super(redisService, config, reflector, jwtService);
    this.role = UserTypes.user;
  }

  protected async checkTokenExpiration(accessToken: string): Promise<boolean> {
    return this._userAuthService.checkTokenExpiration(accessToken);
  }
}
