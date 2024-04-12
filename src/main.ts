import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
// import * as csurf from 'csurf';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService);
  app.use(session({
    secret:configService.getOrThrow("SESSION_SECRET"), 
    resave:false,
    saveUninitialized:true
  }));
  // app.use(csurf());
  await app.listen(3000);
}
bootstrap();
