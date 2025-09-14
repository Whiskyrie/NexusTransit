import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserConsentEntity } from './entities/user-consent.entity';
import { CreateConsentDto, RevokeConsentDto } from './dto/index';
import { ConsentType } from './enums/index';

@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(UserConsentEntity)
    private readonly consentRepository: Repository<UserConsentEntity>,
  ) {}

  /**
   * Cria um novo consentimento para o usuário
   */
  async createConsent(
    userId: string,
    createConsentDto: CreateConsentDto,
  ): Promise<UserConsentEntity> {
    // Validate the input DTO
    if (!createConsentDto?.consentType) {
      throw new BadRequestException('Invalid consent data provided');
    }

    // Verifica se já existe consentimento ativo para este tipo
    const existingConsent = await this.getActiveConsent(userId, createConsentDto.consentType);

    if (existingConsent) {
      throw new BadRequestException(
        `Usuário já possui consentimento ativo para ${createConsentDto.consentType}`,
      );
    }

    const consent = this.consentRepository.create({
      userId,
      ...createConsentDto,
      ...(createConsentDto.expiresAt && { expiresAt: new Date(createConsentDto.expiresAt) }),
    });

    return this.consentRepository.save(consent);
  }

  /**
   * Revoga um consentimento específico
   */
  async revokeConsent(
    userId: string,
    revokeConsentDto: RevokeConsentDto,
  ): Promise<UserConsentEntity> {
    const consent = await this.getActiveConsent(userId, revokeConsentDto.consentType);

    if (!consent) {
      throw new NotFoundException(
        `Consentimento ativo não encontrado para ${revokeConsentDto.consentType}`,
      );
    }

    consent.revoke(revokeConsentDto.revocationReason);
    return this.consentRepository.save(consent);
  }

  /**
   * Obtém consentimento ativo para um tipo específico
   */
  async getActiveConsent(
    userId: string,
    consentType: ConsentType,
  ): Promise<UserConsentEntity | null> {
    return this.consentRepository.findOne({
      where: {
        userId,
        consentType,
        isActive: true,
      },
    });
  }

  /**
   * Obtém todos os consentimentos de um usuário
   */
  async getUserConsents(userId: string): Promise<UserConsentEntity[]> {
    return this.consentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtém apenas consentimentos ativos de um usuário
   */
  async getActiveUserConsents(userId: string): Promise<UserConsentEntity[]> {
    const consents = await this.consentRepository.find({
      where: {
        userId,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });

    // Filtra consentimentos expirados
    return consents.filter(consent => consent.isValid());
  }

  /**
   * Verifica se usuário tem consentimento válido para um tipo específico
   */
  async hasValidConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const consent = await this.getActiveConsent(userId, consentType);
    return consent ? consent.isValid() : false;
  }

  /**
   * Atualiza consentimentos expirados
   */
  async updateExpiredConsents(): Promise<number> {
    const expiredConsents = await this.consentRepository
      .createQueryBuilder('consent')
      .where('consent.isActive = :isActive', { isActive: true })
      .andWhere('consent.expiresAt IS NOT NULL')
      .andWhere('consent.expiresAt < :now', { now: new Date() })
      .getMany();

    for (const consent of expiredConsents) {
      consent.revoke('Consentimento expirado automaticamente');
    }

    if (expiredConsents.length > 0) {
      await this.consentRepository.save(expiredConsents);
    }

    return expiredConsents.length;
  }

  /**
   * Obtém estatísticas de consentimentos
   */
  async getConsentStatistics(): Promise<{
    totalConsents: number;
    activeConsents: number;
    revokedConsents: number;
    expiredConsents: number;
    consentsByType: Record<ConsentType, number>;
  }> {
    const totalConsents = await this.consentRepository.count();

    const activeConsents = await this.consentRepository.count({
      where: { isActive: true },
    });

    const revokedConsents = await this.consentRepository.count({
      where: { isActive: false },
    });

    // Conta consentimentos expirados (ainda ativos mas com data de expiração passada)
    const expiredConsents = await this.consentRepository
      .createQueryBuilder('consent')
      .where('consent.isActive = :isActive', { isActive: true })
      .andWhere('consent.expiresAt IS NOT NULL')
      .andWhere('consent.expiresAt < :now', { now: new Date() })
      .getCount();

    // Conta consentimentos por tipo
    const consentsByTypeQuery = await this.consentRepository
      .createQueryBuilder('consent')
      .select('consent.consentType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('consent.isActive = :isActive', { isActive: true })
      .groupBy('consent.consentType')
      .getRawMany<{ type: ConsentType; count: string }>();

    const consentsByType = {} as Record<ConsentType, number>;
    for (const result of consentsByTypeQuery) {
      consentsByType[result.type] = parseInt(result.count);
    }

    return {
      totalConsents,
      activeConsents,
      revokedConsents,
      expiredConsents,
      consentsByType,
    };
  }

  /**
   * Revoga todos os consentimentos de um usuário (para exclusão de conta)
   */
  async revokeAllUserConsents(
    userId: string,
    reason = 'Exclusão de conta do usuário',
  ): Promise<number> {
    const activeConsents = await this.consentRepository.find({
      where: {
        userId,
        isActive: true,
      },
    });

    for (const consent of activeConsents) {
      consent.revoke(reason);
    }

    if (activeConsents.length > 0) {
      await this.consentRepository.save(activeConsents);
    }

    return activeConsents.length;
  }
}
