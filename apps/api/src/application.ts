import { VersioningType } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import type { EnvironmentSource } from "@syncforge/config";
import { loadDatabaseConfig } from "@syncforge/database";
import helmet from "helmet";

import { AppModule } from "./app.module.js";
import { ApiExceptionFilter } from "./common/http/api-exception.filter.js";
import { createValidationPipe } from "./common/http/validation.js";
import { loadApiConfig } from "./config/api.config.js";
import type { ApiConfig } from "./config/api.config.js";

export interface CreatedApplication {
  readonly app: INestApplication;
  readonly config: ApiConfig;
}

export type ApplicationFactory = (
  source: EnvironmentSource,
) => Promise<CreatedApplication>;

export function configureApplication(
  app: INestApplication,
  config: ApiConfig,
): void {
  app.use(helmet());
  app.enableCors({
    credentials: false,
    origin(
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      callback(
        null,
        requestOrigin === undefined || requestOrigin === config.corsOrigin,
      );
    },
  });
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter(app.get(HttpAdapterHost)));
  app.enableShutdownHooks();
}

export async function createApplication(
  source: EnvironmentSource = process.env,
): Promise<CreatedApplication> {
  const config = loadApiConfig(source);
  const databaseConfig = loadDatabaseConfig(source);
  const app = await NestFactory.create(AppModule.register(databaseConfig));

  configureApplication(app, config);

  return { app, config };
}

export async function startApplication(
  source: EnvironmentSource = process.env,
  factory: ApplicationFactory = createApplication,
): Promise<INestApplication> {
  const created = await factory(source);

  try {
    await created.app.listen(created.config.port);
  } catch (error) {
    await created.app.close();
    throw error;
  }

  return created.app;
}
