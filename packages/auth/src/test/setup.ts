/**
 * Setup global para testes do @nexus/auth
 */

// Importar reflect-metadata para suportar decorators
import "reflect-metadata";

// Mock do console para evitar poluição nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configurações globais do Jest
jest.setTimeout(10000);
