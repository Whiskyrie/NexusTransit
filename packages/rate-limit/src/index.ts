// @nexus/rate-limit - Distributed Rate Limiting Package
// Main exports

// Module
export * from "./rate-limit.module";

// Services
export * from "./services/rate-limit.service";
export * from "./services/blacklist.service";
export * from "./services/monitoring.service";
export * from "./services/alert.service";

// Guards
export * from "./guards/rate-limit.guard";
export * from "./guards/roles.guard";
export * from "./guards/jwt-auth.guard";

// Decorators
export * from "./decorators/rate-limit.decorator";
export * from "./decorators/roles.decorator";

// Entities
export * from "./entities/rate-limit-rule.entity";
export * from "./entities/quota-usage.entity";

// Enums
export * from "./enums/rate-limit-type.enum";
export * from "./enums/role.enum";
export * from "./enums/role-limits.enum";

// Interfaces
export * from "./interfaces/rate-limit.interface";
export * from "./interfaces/rate-limit-strategy.interface";
export * from "./interfaces/monitoring.interface";

// Strategies
export * from "./strategies/sliding-window.strategy";
export * from "./strategies/token-bucket.strategy";
export * from "./strategies/fixed-window.strategy";

// Processors
export * from "./processors/abuse-detection.processor";

// DTOs
export * from "./dto/create-rule.dto";
export * from "./dto/update-rule.dto";

// Config
export * from "./config/rate-limit.config";

// Controller
export * from "./rate-limit.controller";
