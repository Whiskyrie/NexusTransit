import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Auditable } from '@nexus/common';
import { RateLimitStrategyType } from '../interfaces/rate-limit-strategy.interface';

/**
 * Rate Limit Rule Entity
 *
 * Stores configurable rate limiting rules that can be applied
 * based on IP, User, API Key, Endpoint, or globally.
 *
 * Rules can use different strategies (Sliding Window, Token Bucket, Fixed Window)
 * and can be prioritized for fine-grained control.
 */
@Entity('rate_limit_rules')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Rate Limit Rule',
})
@Index(['type', 'is_active'])
@Index(['role_id', 'is_active'])
@Index(['endpoint', 'is_active'])
@Index(['priority'])
export class RateLimitRule extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Type of rate limiting: IP, USER, API_KEY, ENDPOINT, GLOBAL',
  })
  type!: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Strategy to use: SLIDING_WINDOW, TOKEN_BUCKET, FIXED_WINDOW',
  })
  strategy!: RateLimitStrategyType;

  @Column({
    type: 'int',
    comment: 'Maximum number of requests allowed within the time window',
  })
  limit!: number;

  @Column({
    type: 'int',
    comment: 'Time window in milliseconds',
    name: 'window_size',
  })
  window_size!: number;

  @Column({
    type: 'int',
    default: 100,
    comment: 'Rule priority (lower number = higher priority)',
  })
  priority!: number;

  @Column({
    type: 'float',
    nullable: true,
    comment: 'Token refill rate (tokens per second) for TOKEN_BUCKET strategy',
    name: 'refill_rate',
  })
  refill_rate?: number;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Role ID for role-based rate limiting',
    name: 'role_id',
  })
  role_id?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Specific endpoint pattern for endpoint-based limiting',
  })
  endpoint?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'API Key ID for API key-based rate limiting',
    name: 'api_key_id',
  })
  api_key_id?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Whether this rule is currently active',
    name: 'is_active',
  })
  is_active!: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Optional description of the rule purpose',
  })
  description?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional configuration parameters',
  })
  metadata?: Record<string, unknown>;
}
