import { PartialType } from '@nestjs/mapped-types';
import { CreateRouteDto } from './create-route.dto';

/*
PartialType automaticamente torna todos os campos opcionais preservando as validações
do CreateRouteDto; 
Preserva documentação do swagger, apiproperty; 
reduz duplicação de código;
facilita manutenção

-> Segue o princípio DRY - Don't Repeat Yourself
*/

export class UpdateRouteDto extends PartialType(CreateRouteDto) {}
