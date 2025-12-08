import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Auditable } from '../decorators/auditable.decorator';

/**
 * Quota Usage Entity
 *
 * Records rate limit violations and usage history for monitoring,
 * analytics, and abuse detection purposes.
 *
 * This entity helps track:
 * - Who is hitting rate limits
 * - When and where violations occur
 * - Patterns that indicate potential abuse
 */
@Entity('quota_usage')
@Auditable({
  trackCreation: true,
  trackUpdates: false,
  trackDeletion: false,
  excludeFields: [],
  entityDisplayName: 'Quota Usage',
})
@Index(['client_id', 'created_at'])
@Index(['ip', 'created_at'])
@Index(['user_id', 'created_at'])
@Index(['endpoint', 'created_at'])
@Index(['blocked', 'created_at'])
@Index(['created_at'])
export class QuotaUsage extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 64,
    comment: 'Unique client identifier (hash of IP + user agent)',
    name: 'client_id',
  })
  client_id!: string;

  @Column({
    type: 'varchar',
    length: 45,
    comment: 'Client IP address',
  })
  ip!: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'User ID if authenticated',
    name: 'user_id',
  })
  user_id?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'API Key ID if using API key authentication',
    name: 'api_key_id',
  })
  api_key_id?: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'HTTP endpoint accessed',
  })
  endpoint!: string;

  @Column({
    type: 'varchar',
    length: 10,
    comment: 'HTTP method (GET, POST, etc.)',
  })
  method!: string;

  @Column({
    type: 'uuid',
    comment: 'Rate limit rule that was applied',
    name: 'rule_id',
  })
  rule_id!: string;

  @Column({
    type: 'int',
    comment: 'Number of requests made at the time',
  })
  requests_count!: number;

  @Column({
    type: 'int',
    comment: 'Limit that was configured',
  })
  limit!: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this request was blocked due to rate limiting',
  })
  blocked!: boolean;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'User agent string',
    name: 'user_agent',
  })
  user_agent?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata (headers, query params, etc.)',
  })
  metadata?: Record<string, unknown>;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Timestamp of the request',
    name: 'request_time',
  })
  request_time!: Date;
}
