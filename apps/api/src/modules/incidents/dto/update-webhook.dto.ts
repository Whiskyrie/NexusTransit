import { PartialType } from '@nestjs/swagger';
import { CreateWebhookDto } from './create-webhook.dto';

/**
 * DTO para atualização de webhook
 */
export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {}
