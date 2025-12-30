import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { Role as RoleEntity } from '../auth/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleFilterDto } from './dto/role-filter.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { PaginatedResponseDto } from '@nexus/common';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = new RoleEntity();
    Object.assign(role, createRoleDto);
    const saved = await this.roleRepository.save(role);
    return this.mapToResponseDto(saved);
  }

  async findAll(filterDto?: RoleFilterDto): Promise<PaginatedResponseDto<RoleResponseDto>> {
    const { page = 1, limit = 10, search, is_active } = filterDto ?? {};

    const where: Record<string, unknown> = { deleted_at: IsNull() };

    if (search) {
      where.display_name = ILike(`%${search}%`);
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [roles, total] = await this.roleRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: roles.map(r => this.mapToResponseDto(r)),
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.mapToResponseDto(role);
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.roleRepository.findOne({
      where: { name: name as RoleEntity['name'], deleted_at: IsNull() },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    Object.assign(role, updateRoleDto);
    const updated = await this.roleRepository.save(role);
    return this.mapToResponseDto(updated);
  }

  async remove(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await role.softRemove();
  }

  async restore(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!role?.deleted_at) {
      throw new NotFoundException(`Role with ID ${id} not found or not deleted`);
    }

    await role.restore();
    return this.mapToResponseDto(role);
  }

  async assignPermissions(id: string, permissions: string[]): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Adicionar novas permissões sem duplicatas
    const currentPermissions = role.permissions ?? [];
    role.permissions = [...new Set([...currentPermissions, ...permissions])];

    const updated = await this.roleRepository.save(role);
    return this.mapToResponseDto(updated);
  }

  async removePermissions(id: string, permissions: string[]): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Remover permissões especificadas
    const permissionsToRemove = new Set(permissions);
    role.permissions = (role.permissions ?? []).filter(p => !permissionsToRemove.has(p));

    const updated = await this.roleRepository.save(role);
    return this.mapToResponseDto(updated);
  }

  private mapToResponseDto(role: RoleEntity): RoleResponseDto {
    const dto = new RoleResponseDto();
    Object.assign(dto, role);
    return dto;
  }
}
