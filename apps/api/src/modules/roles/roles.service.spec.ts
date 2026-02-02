import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role as RoleEntity } from '../auth/entities/role.entity';
import { Role } from '@nexus/auth';
import { type CreateRoleDto } from './dto/create-role.dto';
import { type UpdateRoleDto } from './dto/update-role.dto';
import { type RoleFilterDto } from './dto/role-filter.dto';
import { RoleResponseDto } from './dto/role-response.dto';

describe('RolesService', () => {
  let service: RolesService;
  let module: TestingModule;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockRole = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: Role.SUPER_ADMIN,
    display_name: 'Super Admin',
    description: 'Administrador do sistema',
    hierarchy_level: 1,
    permissions: ['users:*', 'roles:*'],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    users: [],
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    beforeInsert: jest.fn(),
    afterLoad: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
  } as unknown as RoleEntity;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('create', () => {
    it('should create a role', async () => {
      const createDto: CreateRoleDto = {
        name: Role.SUPER_ADMIN,
        display_name: 'Super Admin',
        description: 'Administrador do sistema',
        hierarchy_level: 1,
        permissions: ['users:*', 'roles:*'],
        is_active: true,
      };

      mockRepository.create.mockReturnValue(mockRole);
      mockRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createDto);

      expect(result).toBeInstanceOf(RoleResponseDto);
      expect(result.id).toBe(mockRole.id);
      expect(result.name).toBe(mockRole.name);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated roles', async () => {
      const filterDto: RoleFilterDto = { page: 1, limit: 10 };
      const roles = [mockRole];

      mockRepository.findAndCount.mockResolvedValue([roles, 1]);

      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      const filterDto: RoleFilterDto = { search: 'admin' };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            display_name: expect.any(Object),
          }),
        }),
      );
    });

    it('should filter by is_active', async () => {
      const filterDto: RoleFilterDto = { is_active: true };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_active: true,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne(mockRole.id);

      expect(result).toBeInstanceOf(RoleResponseDto);
      expect(result.id).toBe(mockRole.id);
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updateDto: UpdateRoleDto = {
        display_name: 'Updated Admin',
      };

      const updatedRole = { ...mockRole, display_name: 'Updated Admin' };
      mockRepository.findOne.mockResolvedValue(mockRole);
      mockRepository.save.mockResolvedValue(updatedRole);

      const result = await service.update(mockRole.id, updateDto);

      expect(result.display_name).toBe('Updated Admin');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', { display_name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft remove a role', async () => {
      const mockRoleWithSoftRemove = {
        ...mockRole,
        softRemove: jest.fn().mockResolvedValue(mockRole),
      } as unknown as RoleEntity;

      mockRepository.findOne.mockResolvedValue(mockRoleWithSoftRemove);

      await service.remove(mockRole.id);

      expect(mockRoleWithSoftRemove.softRemove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore a deleted role', async () => {
      const deletedRole = {
        ...mockRole,
        deleted_at: new Date(),
        restore: jest.fn().mockResolvedValue(undefined),
      } as unknown as RoleEntity;

      mockRepository.findOne.mockResolvedValue(deletedRole);

      const result = await service.restore(mockRole.id);

      expect(result).toBeInstanceOf(RoleResponseDto);
      expect(deletedRole.restore).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.restore('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignPermissions', () => {
    it('should add permissions to a role', async () => {
      const permissions = ['users:create', 'users:read'];
      mockRepository.findOne.mockResolvedValue(mockRole);
      mockRepository.save.mockResolvedValue(mockRole);

      const result = await service.assignPermissions(mockRole.id, permissions);

      expect(result).toBeInstanceOf(RoleResponseDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should not duplicate permissions', async () => {
      const permissions = ['users:create'];
      mockRepository.findOne.mockResolvedValue(mockRole);
      mockRepository.save.mockResolvedValue(mockRole);

      await service.assignPermissions(mockRole.id, permissions);

      const savedRole = mockRepository.save.mock.calls[0][0] as RoleEntity;
      const uniquePermissions = new Set(savedRole.permissions ?? []);
      expect(uniquePermissions.size).toBe(savedRole.permissions?.length ?? 0);
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from a role', async () => {
      const permissionsToRemove = ['users:*'];
      mockRepository.findOne.mockResolvedValue(mockRole);
      mockRepository.save.mockResolvedValue(mockRole);

      const result = await service.removePermissions(mockRole.id, permissionsToRemove);

      expect(result).toBeInstanceOf(RoleResponseDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
