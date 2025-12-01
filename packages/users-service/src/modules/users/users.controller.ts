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
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

/**
 * Users Controller - Microsserviço
 * Mantém FIDELIDADE TOTAL com o monólito
 * 
 * Endpoints implementados (idênticos ao monólito):
 * - POST   /users          - Criar novo usuário
 * - GET    /users          - Listar todos os usuários
 * - GET    /users/:id      - Buscar usuário por ID
 * - PATCH  /users/:id      - Atualizar usuário
 * - DELETE /users/:id      - Soft delete de usuário
 */
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
    description: 'Cria um novo usuário no sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário criado com sucesso',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`POST /users - Creating user: ${createUserDto.email}`);
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Retorna a lista de todos os usuários',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de usuários retornada com sucesso',
    type: [User],
  })
  async findAll(): Promise<User[]> {
    this.logger.log('GET /users - Listing all users');
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os dados de um usuário específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário encontrado',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    this.logger.log(`GET /users/${id} - Finding user`);
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description: 'Atualiza os dados de um usuário existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário atualizado com sucesso',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    this.logger.log(`PATCH /users/${id} - Updating user`);
    const user = await this.usersService.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover usuário',
    description: 'Remove um usuário do sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Usuário removido com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`DELETE /users/${id} - Removing user`);
    const removed = await this.usersService.remove(id);
    if (!removed) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
