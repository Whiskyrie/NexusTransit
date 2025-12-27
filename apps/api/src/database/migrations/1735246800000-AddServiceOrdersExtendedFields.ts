import { type MigrationInterface, type QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Migration para adicionar campos estendidos na tabela service_orders
 *
 * Adiciona:
 * - Campos de relacionamento (customer, endereços)
 * - Campos de pagamento (status, método, nota fiscal)
 * - Campos de carga (peso, volume, volumes)
 * - Campos de seguro
 * - Campos de contato
 * - Campos de SLA e prazos
 * - Novos enums (order_type, payment_status, payment_method)
 */
export class AddServiceOrdersExtendedFields1735246800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar novos enums (com IF NOT EXISTS para suportar re-execução)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "order_type_enum" AS ENUM (
          'PICKUP_DELIVERY',
          'DELIVERY_ONLY',
          'RETURN',
          'TRANSFER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM (
          'PENDING',
          'PAID',
          'OVERDUE',
          'CANCELED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_method_enum" AS ENUM (
          'CASH',
          'CREDIT_CARD',
          'BANK_TRANSFER',
          'INVOICE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Helper para verificar se coluna existe
    const columnExists = async (table: string, column: string): Promise<boolean> => {
      const result = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = '${column}'
        ) as exists
      `);
      return result[0].exists;
    };

    // Helper para adicionar coluna se não existir
    const addColumnIfNotExists = async (column: TableColumn): Promise<void> => {
      if (!(await columnExists('service_orders', column.name))) {
        await queryRunner.addColumn('service_orders', column);
      }
    };

    // Adicionar colunas de relacionamento com Customer (nullable primeiro para suportar dados existentes)
    await addColumnIfNotExists(
      new TableColumn({
        name: 'customer_id',
        type: 'uuid',
        isNullable: true,
        comment: 'ID do cliente associado',
      }),
    );

    // Preencher registros existentes com o primeiro customer disponível
    await queryRunner.query(`
      UPDATE service_orders
      SET customer_id = (SELECT id FROM customers LIMIT 1)
      WHERE customer_id IS NULL
        AND EXISTS (SELECT 1 FROM customers LIMIT 1)
    `);

    // Agora tornar a coluna NOT NULL (só funcionará se todos os registros tiverem customer_id)
    // Se ainda houver registros sem customer_id, mantemos nullable
    const hasNullCustomerId = await queryRunner.query(`
      SELECT COUNT(*) as count FROM service_orders WHERE customer_id IS NULL
    `);

    if (hasNullCustomerId[0].count === '0' || hasNullCustomerId[0].count === 0) {
      await queryRunner.query(`
        ALTER TABLE service_orders ALTER COLUMN customer_id SET NOT NULL
      `);
    }

    // Adicionar coluna order_type
    await addColumnIfNotExists(
      new TableColumn({
        name: 'order_type',
        type: 'order_type_enum',
        default: "'PICKUP_DELIVERY'",
        isNullable: false,
        comment: 'Tipo de ordem (PICKUP_DELIVERY, DELIVERY_ONLY, RETURN, TRANSFER)',
      }),
    );

    // Adicionar colunas de endereço
    await addColumnIfNotExists(
      new TableColumn({
        name: 'pickup_address_id',
        type: 'uuid',
        isNullable: true,
        comment: 'ID do endereço de coleta',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'delivery_address_id',
        type: 'uuid',
        isNullable: true,
        comment: 'ID do endereço de entrega',
      }),
    );

    // Adicionar colunas de contato na coleta
    await addColumnIfNotExists(
      new TableColumn({
        name: 'pickup_contact_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'Nome do contato na coleta',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'pickup_contact_phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Telefone do contato na coleta',
      }),
    );

    // Adicionar colunas de contato na entrega
    await addColumnIfNotExists(
      new TableColumn({
        name: 'delivery_contact_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'Nome do contato na entrega',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'delivery_contact_phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Telefone do contato na entrega',
      }),
    );

    // Adicionar colunas de instruções
    await addColumnIfNotExists(
      new TableColumn({
        name: 'special_instructions',
        type: 'text',
        isNullable: true,
        comment: 'Instruções especiais',
      }),
    );

    // Adicionar colunas de datas
    await addColumnIfNotExists(
      new TableColumn({
        name: 'requested_date',
        type: 'timestamp',
        isNullable: true,
        comment: 'Data solicitada pelo cliente',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'delivery_deadline',
        type: 'timestamp',
        isNullable: true,
        comment: 'Prazo de entrega',
      }),
    );

    // Adicionar colunas de pagamento
    await addColumnIfNotExists(
      new TableColumn({
        name: 'payment_status',
        type: 'payment_status_enum',
        default: "'PENDING'",
        isNullable: false,
        comment: 'Status do pagamento',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'payment_method',
        type: 'payment_method_enum',
        isNullable: true,
        comment: 'Método de pagamento',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'invoice_number',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Número da nota fiscal',
      }),
    );

    // Adicionar colunas de carga
    await addColumnIfNotExists(
      new TableColumn({
        name: 'total_weight',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Peso total em kg',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'total_volume',
        type: 'decimal',
        precision: 10,
        scale: 3,
        isNullable: true,
        comment: 'Volume total em m³',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'package_count',
        type: 'integer',
        isNullable: true,
        comment: 'Quantidade de volumes',
      }),
    );

    // Adicionar colunas de seguro
    await addColumnIfNotExists(
      new TableColumn({
        name: 'requires_insurance',
        type: 'boolean',
        default: false,
        isNullable: false,
        comment: 'Requer seguro',
      }),
    );

    await addColumnIfNotExists(
      new TableColumn({
        name: 'insurance_value',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: true,
        comment: 'Valor do seguro',
      }),
    );

    // Adicionar colunas de SLA
    await addColumnIfNotExists(
      new TableColumn({
        name: 'sla_hours',
        type: 'integer',
        isNullable: true,
        comment: 'SLA em horas',
      }),
    );

    // Adicionar coluna de aprovação
    await addColumnIfNotExists(
      new TableColumn({
        name: 'approved_by_user_id',
        type: 'uuid',
        isNullable: true,
        comment: 'ID do usuário que aprovou a ordem',
      }),
    );

    // Criar índices (usando SQL direto com IF NOT EXISTS)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SERVICE_ORDERS_CUSTOMER_ID" ON "service_orders" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SERVICE_ORDERS_ORDER_TYPE" ON "service_orders" ("order_type")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SERVICE_ORDERS_PAYMENT_STATUS" ON "service_orders" ("payment_status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SERVICE_ORDERS_PICKUP_ADDRESS" ON "service_orders" ("pickup_address_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SERVICE_ORDERS_DELIVERY_ADDRESS" ON "service_orders" ("delivery_address_id")
    `);

    // Criar foreign keys (verificando se já existem)
    const fkExists = async (constraintName: string): Promise<boolean> => {
      const result = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = '${constraintName}'
        ) as exists
      `);
      return result[0].exists;
    };

    if (!(await fkExists('FK_SERVICE_ORDERS_CUSTOMER'))) {
      await queryRunner.createForeignKey(
        'service_orders',
        new TableForeignKey({
          name: 'FK_SERVICE_ORDERS_CUSTOMER',
          columnNames: ['customer_id'],
          referencedTableName: 'customers',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!(await fkExists('FK_SERVICE_ORDERS_PICKUP_ADDRESS'))) {
      await queryRunner.createForeignKey(
        'service_orders',
        new TableForeignKey({
          name: 'FK_SERVICE_ORDERS_PICKUP_ADDRESS',
          columnNames: ['pickup_address_id'],
          referencedTableName: 'customer_addresses',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    if (!(await fkExists('FK_SERVICE_ORDERS_DELIVERY_ADDRESS'))) {
      await queryRunner.createForeignKey(
        'service_orders',
        new TableForeignKey({
          name: 'FK_SERVICE_ORDERS_DELIVERY_ADDRESS',
          columnNames: ['delivery_address_id'],
          referencedTableName: 'customer_addresses',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Comentário de atualização
    await queryRunner.query(`
      COMMENT ON TABLE service_orders IS 'Gerenciamento completo de ordens de serviço com suporte a pagamentos, seguros, SLA e integração com clientes';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.dropForeignKey('service_orders', 'FK_SERVICE_ORDERS_DELIVERY_ADDRESS');
    await queryRunner.dropForeignKey('service_orders', 'FK_SERVICE_ORDERS_PICKUP_ADDRESS');
    await queryRunner.dropForeignKey('service_orders', 'FK_SERVICE_ORDERS_CUSTOMER');

    // Remover índices
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_DELIVERY_ADDRESS');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_PICKUP_ADDRESS');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_PAYMENT_STATUS');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_ORDER_TYPE');
    await queryRunner.dropIndex('service_orders', 'IDX_SERVICE_ORDERS_CUSTOMER_ID');

    // Remover colunas
    await queryRunner.dropColumn('service_orders', 'approved_by_user_id');
    await queryRunner.dropColumn('service_orders', 'sla_hours');
    await queryRunner.dropColumn('service_orders', 'insurance_value');
    await queryRunner.dropColumn('service_orders', 'requires_insurance');
    await queryRunner.dropColumn('service_orders', 'package_count');
    await queryRunner.dropColumn('service_orders', 'total_volume');
    await queryRunner.dropColumn('service_orders', 'total_weight');
    await queryRunner.dropColumn('service_orders', 'invoice_number');
    await queryRunner.dropColumn('service_orders', 'payment_method');
    await queryRunner.dropColumn('service_orders', 'payment_status');
    await queryRunner.dropColumn('service_orders', 'delivery_deadline');
    await queryRunner.dropColumn('service_orders', 'requested_date');
    await queryRunner.dropColumn('service_orders', 'special_instructions');
    await queryRunner.dropColumn('service_orders', 'delivery_contact_phone');
    await queryRunner.dropColumn('service_orders', 'delivery_contact_name');
    await queryRunner.dropColumn('service_orders', 'pickup_contact_phone');
    await queryRunner.dropColumn('service_orders', 'pickup_contact_name');
    await queryRunner.dropColumn('service_orders', 'delivery_address_id');
    await queryRunner.dropColumn('service_orders', 'pickup_address_id');
    await queryRunner.dropColumn('service_orders', 'order_type');
    await queryRunner.dropColumn('service_orders', 'customer_id');

    // Remover enums
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_type_enum"`);

    // Restaurar comentário original
    await queryRunner.query(`
      COMMENT ON TABLE service_orders IS 'Gerenciamento de ordens de serviço para manutenção, entregas especiais, coletas e inspeções';
    `);
  }
}
