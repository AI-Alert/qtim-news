import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  debug: process.env.DEBUG === 'true',
  defaultAdminEmail: 'admin@admin.com',
  jwt: {
    secret: process.env.AUTH_JWT_SECRET || 'AbCdEfG53Gwcw1grbr',
    field: process.env.AUTH_JWT_FIELD || 'token',
    expiresIn: process.env.AUTH_JWT_ACCESS_EXPIRY || '30m',
    refreshExpiresIn: process.env.AUTH_JWT_REFRESH_EXPIRY || '1h',
  },
  throttle: {
    ttl: 5,
    limit: 30,
  },
  database: {
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'qtim',
    port: Number.parseInt(process.env.DB_PORT, 10),
    logging: ['warn', 'error', 'migration', 'schema'],
    migrationsTableName: 'migrations',
    migrations: [path.join('dist', '**', '*-migration.js')],
    entities: [path.join('dist', '**', '*.entity.js')],
    subscribers: [path.join('dist', '**', 'subscribers', '*.js')],
    cli: {
      migrationsDir: path.join(__dirname, 'migrations'),
    },
    synchronize: true,
  },
  redis: {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
    },
    jwtClient: process.env.REDIS_JWT_CLIENT || 'jwt',
    jwtRefreshClient: process.env.REDIS_JWT_REFRESH_CLIENT || 'jwt-refresh',
    expiresInSeconds: Number(process.env.TOKEN_EXPIRES_SECONDS) || 24 * 60 * 60,
    refreshExpiresInSeconds:
      Number(process.env.REFRESH_TOKEN_EXPIRES_SECONDS) || 24 * 60 * 60 * 7,
  },
});
