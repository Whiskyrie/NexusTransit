#!/usr/bin/env node

/**
 * CLI para executar seeds do banco de dados
 *
 * Uso:
 *   ts-node src/cli/seed.ts          # Executa todos os seeds
 *   ts-node src/cli/seed.ts roles    # Executa apenas seed de roles
 *   ts-node src/cli/seed.ts admin    # Executa apenas seed do admin
 *   ts-node src/cli/seed.ts users    # Executa apenas seed de usuários teste
 */

import { NestFactory } from "@nestjs/core";
import { SeedingModule } from "../seeding.module";
import { SeedingService } from "../seeding.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedingModule);
  const seedingService = app.get(SeedingService);

  const seedName = process.argv[2];

  try {
    if (seedName) {
      await seedingService.runSeed(seedName);
    } else {
      await seedingService.runAllSeeds();
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error("Erro ao executar seed:", error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
