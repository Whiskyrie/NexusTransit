// @nexus/compliance - LGPD/GDPR Compliance Package
// Main exports

// Module
export * from "./compliance.module";

// Services
export * from "./consent.service";
export * from "./data-request.service";
export * from "./data-portability.service";

// Entities
export * from "./entities/user-consent.entity";
export * from "./entities/data-request.entity";
export * from "./entities/lgpdEntities";

// DTOs
export * from "./dto/create-consent.dto";
export * from "./dto/revoke-consent.dto";
export * from "./dto/create-data-request.dto";
export * from "./dto/update-data-request.dto";
export * from "./dto/lgpdDto";

// Enums
export * from "./enums/consent-type.enum";
export * from "./enums/data-request-type.enum";
export * from "./enums/data-request-status.enum";
export * from "./enums/lgpdEnums";

// Controller
export * from "./compliance.controller";
