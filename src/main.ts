import {ClassSerializerInterceptor, Logger as Log, ValidationPipe} from "@nestjs/common";
import helmet from "helmet";

import {NestFactory, Reflector} from '@nestjs/core';
import {useContainer} from "class-validator";
import { AppModule } from './app.module';
import {setupSwagger} from "@shared/utils";

const DEFAULT_PORT = 3000;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Для автоматического преобразования объектов классов в JSON
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  //Логер, который используем в приложении
  const logger = new Log('Bootstrap');
  app.useLogger(logger)

  // Для установки HTTP заголовков (безопасность)
  app.use(helmet());

  app.setGlobalPrefix('api/v1');
  app.enableCors();

  await app.listen(process.env.PORT || DEFAULT_PORT).then(async () => {
    logger.log(`Server is listening on ${await app.getUrl()}`);
  });
}
bootstrap();
