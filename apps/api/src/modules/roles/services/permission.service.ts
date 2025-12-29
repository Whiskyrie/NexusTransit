import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Permission } from '../../auth/entities/permission.entity';
import { PermissionResponseDto } from '../dto/permission-response.dto';
import { isValidPermission, getResourcePermissions } from '../constants';

/**
 * Service para gerenciamento de Permissões
 *
 * Responsável por CRUD de permissões e validações
 */
@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Cria uma nova permissão
   */
  async create(data: {
    name: string;
    resource: string;
    action: string;
    display_name: string;
    description?: string;
  }): Promise<Permission> {
    // Validar formato da permissão
    if (!isValidPermission(data.name)) {
      throw new Error(`Permissão inválida: ${data.name}`);
    }

    const permission = this.permissionRepository.create(data);
    const saved = await this.permissionRepository.save(permission);

    this.logger.log(`Permissão criada: ${saved.name}`);
    return saved;
  }

  /**
   * Busca todas as permissões
   */
  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { deleted_at: IsNull() },
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Busca permissões por recurso
   */
  async findByResource(resource: string): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { resource, deleted_at: IsNull() },
      order: { action: 'ASC' },
    });
  }

  /**
   * Busca permissões por ação
   */
  async findByAction(action: string): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { action, deleted_at: IsNull() },
      order: { resource: 'ASC' },
    });
  }

  /**
   * Busca permissões por role
   */
  async findByRole(roleId: string): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .andWhere('permission.deleted_at IS NULL')
      .getMany();

    return permissions.map(p => {
      const dto = new PermissionResponseDto();
      Object.assign(dto, p);
      return dto;
    });
  }

  /**
   * Busca uma permissão por ID
   */
  async findOne(id: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
  }

  /**
   * Busca uma permissão por nome
   */
  async findByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { name, deleted_at: IsNull() },
    });
  }

  /**
   * Atualiza uma permissão
   */
  async update(
    id: string,
    data: Partial<{
      display_name: string;
      description: string;
      is_active: boolean;
    }>,
  ): Promise<Permission | null> {
    const permission = await this.findOne(id);

    if (!permission) {
      throw new NotFoundException(`Permissão com ID ${id} não encontrada`);
    }

    Object.assign(permission, data);
    const updated = await this.permissionRepository.save(permission);

    this.logger.log(`Permissão atualizada: ${updated.name}`);
    return updated;
  }

  /**
   * Remove (soft delete) uma permissão
   */
  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);

    if (!permission) {
      throw new NotFoundException(`Permissão com ID ${id} não encontrada`);
    }

    await this.permissionRepository.softRemove(permission);

    this.logger.log(`Permissão removida: ${permission.name}`);
  }

  /**
   * Ativa ou desativa uma permissão
   */
  async toggleActive(id: string): Promise<Permission> {
    const permission = await this.findOne(id);

    if (!permission) {
      throw new NotFoundException(`Permissão com ID ${id} não encontrada`);
    }

    permission.is_active = !permission.is_active;
    const updated = await this.permissionRepository.save(permission);

    this.logger.log(`Permissão ${permission.name} ${updated.is_active ? 'ativada' : 'desativada'}`);
    return updated;
  }

  /**
   * Sincroniza permissões padrão do sistema
   */
  async syncDefaultPermissions(): Promise<void> {
    const existingPermissions = await this.findAll();
    const existingNames = new Set(existingPermissions.map(p => p.name));

    const allPermissions = getResourcePermissions('*').flat();

    for (const permissionName of allPermissions) {
      if (!existingNames.has(permissionName)) {
        const [resource, action] = permissionName.split(':');

        await this.create({
          name: permissionName,
          resource,
          action,
          display_name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
          description: `Permissão para ${action} em ${resource}`,
        });
      }
    }

    this.logger.log('Permissões padrão sincronizadas');
  }
}
