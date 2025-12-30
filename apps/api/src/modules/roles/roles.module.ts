import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';

// Services
import { PermissionService } from './services/permission.service';
import { RoleHierarchyService } from './services/role-hierarchy.service';
import { RoleCacheService } from './services/role-cache.service';

// Guards
import { PermissionsGuard } from './guards/permissions.guard';

// Interceptors
import { RoleAuditInterceptor } from './interceptors/role-audit.interceptor';

// Subscribers
import { RoleSubscriber } from './subscribers/role.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  controllers: [RolesController],
  providers: [
    // Services
    RolesService,
    PermissionService,
    RoleHierarchyService,
    RoleCacheService,

    // Guards
    PermissionsGuard,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },

    // Interceptors
    RoleAuditInterceptor,

    // Subscribers
    RoleSubscriber,
  ],
  exports: [
    RolesService,
    PermissionService,
    RoleHierarchyService,
    RoleCacheService,
    PermissionsGuard,
    RoleAuditInterceptor,
    TypeOrmModule,
  ],
})
export class RolesModule {}
