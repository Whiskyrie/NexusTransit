#!/usr/bin/env node

/**
 * CLI para executar seeds do banco de dados
 *
 * Uso:
 *   ts-node src/cli/seed.ts                    # Executa todos os seeds (env: dev)
 *   ts-node src/cli/seed.ts --env=test         # Executa todos os seeds para teste
 *   ts-node src/cli/seed.ts --env=prod         # Executa seeds de produção (sem usuários teste)
 *   ts-node src/cli/seed.ts roles              # Executa apenas seed de roles
 *   ts-node src/cli/seed.ts admin --env=prod   # Executa seed do admin em produção
 *   ts-node src/cli/seed.ts users              # Executa seed de usuários teste
 *   ts-node src/cli/seed.ts --list             # Lista seeds disponíveis
 */

import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { SeedingModule } from "../seeding.module";
import { SeedingService, SeedEnvironment } from "../seeding.service";

interface CliArgs {
  seedName?: string;
  env: SeedEnvironment;
  list: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    env: "dev",
    list: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--env=")) {
      const envValue = arg.split("=")[1] as SeedEnvironment;
      if (["dev", "test", "prod"].includes(envValue)) {
        result.env = envValue;
      } else {
        throw new Error(`Ambiente inválido: ${envValue}. Use: dev, test, prod`);
      }
    } else if (arg === "--list" || arg === "-l") {
      result.list = true;
    } else if (!arg.startsWith("--")) {
      result.seedName = arg;
    }
  }

  return result;
}

async function bootstrap() {
  const { seedName, env, list } = parseArgs();

  const logger = new Logger("SeedingCLI");

  const app = await NestFactory.createApplicationContext(SeedingModule, {
    logger: ["log", "error", "warn"],
  });
  const seedingService = app.get(SeedingService);

  try {
    if (list) {
      logger.log("Seeds disponíveis:");
      seedingService.getAvailableSeeds().forEach((seed) => {
        logger.log(`  - ${seed}`);
      });
      await app.close();
      process.exit(0);
    }

    logger.log(`Ambiente: ${env}`);

    if (seedName) {
      await seedingService.runSeed(seedName, env);
    } else {
      await seedingService.runAllSeeds(env);
    }

    logger.log("Processo finalizado com sucesso");

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error("Erro ao executar seed:", error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
