import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

// Services auxiliares
import { UserValidationService } from './services/user-validation.service';
import { UserSearchService } from './services/user-search.service';

// Subscribers
import { UserSubscriber } from './subscribers/user.subscriber';

// Validators
import { IsUniqueEmailConstraint } from './validators/unique-email.validator';
import { IsStrongPasswordConstraint } from './validators/strong-password.validator';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    // Service principal
    UsersService,

    // Services auxiliares
    UserValidationService,
    UserSearchService,

    // Subscribers
    UserSubscriber,

    // Validators
    IsUniqueEmailConstraint,
    IsStrongPasswordConstraint,
  ],
  exports: [UsersService, UserValidationService, UserSearchService, TypeOrmModule],
})
export class UsersModule {}
