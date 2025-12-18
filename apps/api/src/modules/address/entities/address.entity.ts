import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@nexus/common';
import { Auditable } from '@nexus/audit';

/**
 * Entidade de endereço
 * Armazena informações completas de endereços incluindo geolocalização
 */
@Entity('addresses')
@Auditable({
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ['updated_at', 'created_at'],
  entityDisplayName: 'Address',
})
export class Address extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 9,
    nullable: true,
    comment: 'CEP do endereço (formato: 00000-000)',
  })
  cep?: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Logradouro/rua do endereço',
  })
  street!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Número do endereço',
  })
  number?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Complemento do endereço',
  })
  complement?: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Bairro do endereço',
  })
  neighborhood!: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Cidade do endereço',
  })
  city!: string;

  @Column({
    type: 'varchar',
    length: 2,
    comment: 'Estado do endereço (UF)',
  })
  state!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'País do endereço',
    default: 'Brasil',
  })
  country?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    comment: 'Latitude do endereço',
  })
  latitude?: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    comment: 'Longitude do endereço',
  })
  longitude?: number;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Endereço completo formatado',
  })
  formatted_address?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Código do IBGE da cidade',
  })
  ibge_code?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Código GIA (Guia de Informação e Apuração do ICMS)',
  })
  gia_code?: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'DDD da região',
  })
  ddd?: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Código SIAFI (Sistema Integrado de Administração Financeira)',
  })
  siafi_code?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o endereço está ativo',
  })
  is_active!: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações sobre o endereço',
  })
  notes?: string;

  /**
   * Retorna o endereço completo formatado
   */
  getFullAddress(): string {
    const parts = [
      this.street,
      this.number,
      this.complement,
      this.neighborhood,
      this.city,
      this.state,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Verifica se o endereço possui coordenadas geográficas
   */
  hasCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }
}
