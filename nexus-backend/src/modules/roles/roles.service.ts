import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { deleted_at: IsNull() },
    });
  }

  async findOne(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name, deleted_at: IsNull() },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role | null> {
    const role = await this.findOne(id);
    if (!role) {
      return null;
    }

    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<boolean> {
    const role = await this.findOne(id);
    if (!role) {
      return false;
    }

    await role.softRemove();
    return true;
  }

  async restore(id: string): Promise<Role | null> {
    const role = await this.roleRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!role?.deleted_at) {
      return null;
    }

    await role.restore();
    return role;
  }
}
