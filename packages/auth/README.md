# @nexus/auth

Package compartilhado de autenticação para NexusTransit.

## Conteúdo

- **Guards**: JwtAuthGuard, RolesGuard
- **Decorators**: @Public(), @Roles(), @CurrentUser()
- **Strategies**: JwtStrategy
- **Interfaces**: JwtPayload, AuthenticatedRequest
- **Enums**: Role

## Uso

```typescript
import { JwtAuthGuard, RolesGuard, Roles, Public, Role } from '@nexus/auth';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Public()
  @Get('public')
  getPublicData() {
    return 'Public data';
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  getAdminData() {
    return 'Admin only data';
  }
}
```
