import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAddressesTable1766021500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela addresses
    await queryRunner.createTable(
      new Table({
        name: 'addresses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
            comment: 'ID único do endereço',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
            comment: 'Data de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
            comment: 'Data da última atualização do registro',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Data de exclusão lógica do registro',
          },
          {
            name: 'cep',
            type: 'varchar',
            length: '9',
            isNullable: true,
            comment: 'CEP do endereço (formato: 00000-000)',
          },
          {
            name: 'street',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Logradouro/rua do endereço',
          },
          {
            name: 'number',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Número do endereço',
          },
          {
            name: 'complement',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Complemento do endereço',
          },
          {
            name: 'neighborhood',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Bairro do endereço',
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Cidade do endereço',
          },
          {
            name: 'state',
            type: 'varchar',
            length: '2',
            isNullable: false,
            comment: 'Estado do endereço (UF)',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
            default: "'Brasil'",
            comment: 'País do endereço',
          },
          {
            name: 'latitude',
            type: 'numeric',
            precision: 10,
            scale: 8,
            isNullable: true,
            comment: 'Latitude do endereço',
          },
          {
            name: 'longitude',
            type: 'numeric',
            precision: 11,
            scale: 8,
            isNullable: true,
            comment: 'Longitude do endereço',
          },
          {
            name: 'formatted_address',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Endereço completo formatado',
          },
          {
            name: 'ibge_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Código do IBGE da cidade',
          },
          {
            name: 'gia_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Código GIA (Guia de Informação e Apuração do ICMS)',
          },
          {
            name: 'ddd',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'DDD da região',
          },
          {
            name: 'siafi_code',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Código SIAFI (Sistema Integrado de Administração Financeira)',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Indica se o endereço está ativo',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações sobre o endereço',
          },
        ],
      }),
      true,
    );

    // Criar índices para otimizar consultas
    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_cep',
        columnNames: ['cep'],
      }),
    );

    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_city_state',
        columnNames: ['city', 'state'],
      }),
    );

    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_is_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.createIndex(
      'addresses',
      new TableIndex({
        name: 'IDX_addresses_location',
        columnNames: ['latitude', 'longitude'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('addresses', 'IDX_addresses_location');
    await queryRunner.dropIndex('addresses', 'IDX_addresses_deleted_at');
    await queryRunner.dropIndex('addresses', 'IDX_addresses_is_active');
    await queryRunner.dropIndex('addresses', 'IDX_addresses_city_state');
    await queryRunner.dropIndex('addresses', 'IDX_addresses_cep');

    // Remover tabela
    await queryRunner.dropTable('addresses');
  }
}
