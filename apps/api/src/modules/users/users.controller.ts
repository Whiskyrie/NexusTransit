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
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo usuário',
    description:
      'Cria um novo usuário no sistema com validação completa de dados, email único e senha forte',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Dados inválidos: email em formato incorreto, senha fraca, ou campos obrigatórios ausentes',
  })
  @ApiConflictResponse({
    description: 'Email já está em uso por outro usuário',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Criando usuário: ${createUserDto.email}`);
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuários com filtros e paginação',
    description:
      'Retorna lista paginada de usuários com suporte a filtros por status, tipo, email verificado e busca por texto',
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
    example: 'João Silva',
    description: 'Busca por nome ou email',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'user_type',
    required: false,
    enum: ['ADMIN', 'DRIVER', 'CUSTOMER', 'OPERATOR'],
    description: 'Filtrar por tipo de usuário',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de usuários com metadados',
  })
  async findAll(
    @Query() filterDto: UserFilterDto,
  ): Promise<ReturnType<typeof this.usersService.findAll>> {
    return this.usersService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description:
      'Retorna detalhes completos de um usuário específico pelo ID (excluindo campos sensíveis)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do usuário',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário encontrado',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description:
      'Atualiza campos específicos de um usuário. Senha não pode ser alterada por este endpoint',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do usuário',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover usuário',
    description: 'Remove um usuário do sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do usuário',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Usuário removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar usuário',
    description: 'Restaura um usuário que foi removido (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário restaurado com sucesso',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado ou não está deletado',
  })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.usersService.restore(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found or not deleted`);
    }
    return user;
  }
}
