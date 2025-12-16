import {
  ValidationPipe,
  ValidationError,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

import { ServerConfig, CorsConfig, LogConfig } from './config/configuration';

import CustomLogger from './core/customLogger';
import { HttpExceptionFilter } from './lib/http-exception.filter';
import { DrizzleQueryErrorFilter } from './drizzle/drizzle-query-error.filter';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.LOG_DISABLED === 'true' ? false : undefined,
  });

  app.getHttpAdapter().getInstance().set('trust proxy', 1); // Zorgt ervoor dat rate limiting werkt op cloud platform zoals Render

  // 👉 Typed config ophalen
  const config = app.get(ConfigService<ServerConfig>);
  const port = config.get<number>('port')!;
  const cors = config.get<CorsConfig>('cors')!;
  const log = config.get<LogConfig>('log')!;

  if (!log.disabled) {
    app.useLogger(new CustomLogger({ logLevels: log.levels }));
  }
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new DrizzleQueryErrorFilter());
  app.use(helmet());
  app.use(compression()); // compress de JSON data die wordt teruggestuurd

  const httpAdapter = app.getHttpAdapter();

  httpAdapter.get('/', (req, res) => {
    res
      .status(200)
      .send({ message: 'Server is running. Use /api endpoint for services.' }); // Methode om 404 http exceptions in Render af te handelen
  });

  // globale prefix /api
  app.setGlobalPrefix('api');

  // CORS uit config (NIET hardcoded) -> eigenlijk niet nodig in dit project aangezien geen frontend
  app.enableCors({
    origins: cors.origins,
    maxAge: cors.maxAge,
  });

  // VALIDATION + custom error format
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,

      exceptionFactory: (errors: ValidationError[] = []) => {
        const formattedErrors = errors.reduce(
          (acc, err) => {
            acc[err.property] = Object.values(err.constraints || {});
            return acc;
          },
          {} as Record<string, string[]>,
        );

        return new BadRequestException({
          details: { body: formattedErrors },
        });
      },
    }),
  );

  // Swagger Configuratie
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Event Ticket Manager API')
    .setDescription(
      'API documentation for the Event Ticket Manager application',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Swagger ui op /docs
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, () => {
    new Logger().log(`Server is listening at port ${port}`);
    new Logger().log(
      `Swagger UI is available at http://localhost:${port}/docs`,
    );
  });
}

bootstrap();
