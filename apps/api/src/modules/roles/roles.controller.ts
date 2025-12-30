import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { PermissionService } from './services/permission.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleFilterDto } from './dto/role-filter.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { PaginatedResponseDto } from '@nexus/common';
import { RoleAuditInterceptor } from './interceptors/role-audit.interceptor';
import { Roles, Role } from '@nexus/auth';

@ApiTags('Roles & Permissions')
@Controller('roles')
@ApiBearerAuth()
@UseInterceptors(RoleAuditInterceptor)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionService: PermissionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Criar novo role',
    description: 'Cria um novo role no sistema com permissões específicas',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Role criado com sucesso',
    type: RoleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiConflictResponse({
    description: 'Role já existe',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para criar roles',
  })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Listar roles',
    description: 'Lista todos os roles do sistema com filtros e paginação',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Itens por página (máximo 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nome ou descrição',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de roles',
    type: [RoleResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para listar roles',
  })
  async findAll(@Query() filterDto: RoleFilterDto): Promise<PaginatedResponseDto<RoleResponseDto>> {
    return this.rolesService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Buscar role por ID',
    description: 'Retorna detalhes completos de um role incluindo suas permissões',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do role',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role encontrado',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Role não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para visualizar roles',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResponseDto> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Atualizar role',
    description: 'Atualiza campos específicos de um role',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do role',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role atualizado com sucesso',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Role não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para atualizar roles',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Remover role',
    description: 'Remove um role (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do role',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Role removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Role não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para remover roles',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Post(':id/restore')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Restaurar role',
    description: 'Restaura um role removido (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do role',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role restaurado com sucesso',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Role não encontrado ou não está deletado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão para restaurar roles',
  })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResponseDto> {
    return this.rolesService.restore(id);
  }

  // ========== Endpoints de Permissões ==========

  @Get(':id/permissions')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Listar permissões de um role',
    description: 'Retorna todas as permissões atribuídas a um role',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do role',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de permissões',
    type: [PermissionResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Role não encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async getRolePermissions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PermissionResponseDto[]> {
    return this.permissionService.findByRole(id);
  }

  @Post(':id/permissions')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Atribuir permissões a um role',
    description: 'Adiciona permissões específicas a um role',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do role',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissões atribuídas com sucesso',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Role ou permissão não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignPermissionDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.assignPermissions(id, assignDto.permissions);
  }

  @Delete(':id/permissions')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Remover permissões de um role',
    description: 'Remove permissões específicas de um role',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do role',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissões removidas com sucesso',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Role não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiForbiddenResponse({
    description: 'Usuário não possui permissão',
  })
  async removePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignPermissionDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.removePermissions(id, assignDto.permissions);
  }
}
