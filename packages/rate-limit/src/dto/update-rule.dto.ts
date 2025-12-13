import { PartialType } from "@nestjs/swagger";
import { CreateRuleDto } from "./create-rule.dto";

/**
 * DTO para atualizar regra de rate limiting existente
 */
export class UpdateRuleDto extends PartialType(CreateRuleDto) {}
