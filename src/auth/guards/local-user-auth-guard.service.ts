import {Injectable} from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";
import {AuthGuardType} from "@constants/auth.constant";

@Injectable()
export class LocalUserAuthGuard extends AuthGuard(
  AuthGuardType.LocalUser,
) {}
