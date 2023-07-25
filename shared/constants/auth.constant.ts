export enum AuthGuardType {
  Jwt = 'jwt',
  JwtRefresh = 'jwt-refresh',
  LocalUser = 'local.user',
}

export interface TokenPair {
  accessToken: string,
  refreshToken: string,
}
