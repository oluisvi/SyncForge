import "reflect-metadata";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { loadApiConfig } from "./config/api.config.js";

export async function createApplication(): Promise<INestApplication> {
  const config = loadApiConfig(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.enableCors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    (
      request: { path?: string },
      response: { setHeader(name: string, value: string): void },
      next: () => void,
    ) => {
      if (request.path?.includes("/auth/"))
        response.setHeader("Cache-Control", "no-store");
      next();
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: false,
      stopAtFirstError: false,
    }),
  );
  app.enableShutdownHooks();
  return app;
}
