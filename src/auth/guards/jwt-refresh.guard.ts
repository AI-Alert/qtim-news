import {AuthGuardType} from "@constants/auth.constant";
import {AuthGuard} from "@nestjs/passport";
import {Injectable} from "@nestjs/common";

@Injectable()
export default class JwtRefreshGuard extends AuthGuard(
  AuthGuardType.JwtRefresh,
) {}
