import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@ApiTags('Roles')
@Controller('roles')
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo papel',
    description: 'Cria um novo papel (role) com permissões específicas no sistema',
  })
  @ApiCreatedResponse({
    description: 'Papel criado com sucesso',
    type: Role,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
    schema: {
      example: {
        statusCode: 400,
        message: ['name must be a string', 'type must be a valid enum value'],
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Papel com este nome já existe',
  })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os papéis',
    description: 'Retorna lista de todos os papéis ativos no sistema',
  })
  @ApiOkResponse({
    description: 'Lista de papéis retornada com sucesso',
    type: [Role],
  })
  async findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar papel por ID',
    description: 'Retorna detalhes de um papel específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do papel',
    type: String,
    format: 'uuid',
    example: 'b7af2f88-4a8e-4c6a-9b5d-7f3e8c9d2a1b',
  })
  @ApiOkResponse({
    description: 'Papel encontrado',
    type: Role,
  })
  @ApiNotFoundResponse({
    description: 'Papel não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Role> {
    const role = await this.rolesService.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar papel',
    description: 'Atualiza informações de um papel existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do papel',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Papel atualizado com sucesso',
    type: Role,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiNotFoundResponse({
    description: 'Papel não encontrado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.rolesService.update(id, updateRoleDto);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar papel',
    description: 'Remove um papel do sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do papel',
    type: String,
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Papel removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Papel não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const success = await this.rolesService.remove(id);
    if (!success) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar papel deletado',
    description: 'Restaura um papel que foi soft deleted',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do papel',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Papel restaurado com sucesso',
    type: Role,
  })
  @ApiNotFoundResponse({
    description: 'Papel não encontrado ou não estava deletado',
  })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Role> {
    const role = await this.rolesService.restore(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found or not deleted`);
    }
    return role;
  }
}
