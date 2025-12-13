import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { Logger, Injectable } from '@nestjs/common';
import { DriverDocument } from '../entities/driver-document.entity';

/**
 * TypeORM Subscriber para monitorar uploads e mudanças em documentos de motoristas
 *
 * Funcionalidades:
 * - Monitora uploads de documentos
 * - Valida tipos de documentos obrigatórios
 * - Notifica sobre aprovação/rejeição
 * - Registra histórico de alterações
 *
 * @class DriverDocumentSubscriber
 */
@Injectable()
@EventSubscriber()
export class DriverDocumentSubscriber implements EntitySubscriberInterface<DriverDocument> {
  private readonly logger = new Logger(DriverDocumentSubscriber.name);

  /**
   * Tipos de documentos obrigatórios para motoristas
   */
  private readonly REQUIRED_DOCUMENTS = [
    'CNH',
    'CPF',
    'RG',
    'COMPROVANTE_RESIDENCIA',
    'CERTIDAO_ANTECEDENTES',
  ];

  /**
   * Indica qual entidade este subscriber monitora
   */
  listenTo(): typeof DriverDocument {
    return DriverDocument;
  }

  /**
   * Chamado após inserir um novo documento
   */
  afterInsert(event: InsertEvent<DriverDocument>): void {
    const entity = this.getDriverDocumentEntity(event.entity);

    if (!entity) {
      return;
    }

    this.logger.log(
      `Novo documento enviado: ${entity.document_type} - Driver: ${entity.driver?.id ?? 'Unknown'}`,
    );

    // Verifica se é um documento obrigatório
    if (this.REQUIRED_DOCUMENTS.includes(entity.document_type)) {
      this.logger.log(`Documento obrigatório recebido: ${entity.document_type}`);
    }

    // TODO: Implementar notificação para administradores revisarem o documento
    // this.notificationService.notifyNewDocument(entity);
  }

  /**
   * Chamado após atualizar um documento
   */
  afterUpdate(event: UpdateEvent<DriverDocument>): void {
    const entity = this.getDriverDocumentEntity(event.entity);
    const databaseEntity = this.getDriverDocumentEntity(event.databaseEntity);

    if (!entity || !databaseEntity) {
      return;
    }

    // Detecta aprovação do documento (baseado em is_active)
    if (this.isApproved(entity, databaseEntity)) {
      this.logger.log(
        `Documento ATIVADO: ${entity.document_type} - Driver: ${entity.driver?.id ?? 'Unknown'}`,
      );

      // TODO: Notificar motorista sobre ativação do documento
      // this.notificationService.notifyDocumentActivated(entity);
    }

    // Detecta desativação do documento
    if (this.isDeactivated(entity, databaseEntity)) {
      this.logger.warn(
        `Documento DESATIVADO: ${entity.document_type} - ` +
          `Driver: ${entity.driver?.id ?? 'Unknown'}`,
      );

      // TODO: Notificar motorista sobre desativação
      // this.notificationService.notifyDocumentDeactivated(entity);
    }

    // Detecta mudança de tipo de documento
    if (entity.document_type !== databaseEntity.document_type) {
      this.logger.warn(
        `Tipo de documento alterado: ${databaseEntity.document_type} -> ${entity.document_type}`,
      );
    }

    // Detecta exclusão lógica
    if (entity.deleted_at && !databaseEntity.deleted_at) {
      this.logger.warn(`Documento ${entity.document_type} foi excluído (soft delete)`);
    }
  }

  /**
   * Verifica se o documento foi ativado/aprovado
   */
  private isApproved(newEntity: DriverDocument, oldEntity: DriverDocument): boolean {
    return newEntity.is_active === true && oldEntity.is_active === false;
  }

  /**
   * Verifica se o documento foi desativado
   */
  private isDeactivated(newEntity: DriverDocument, oldEntity: DriverDocument): boolean {
    return newEntity.is_active === false && oldEntity.is_active === true;
  }

  /**
   * Type guard para garantir que a entidade é um DriverDocument válido
   */
  private getDriverDocumentEntity(entity: unknown): DriverDocument | null {
    if (!entity || typeof entity !== 'object') {
      return null;
    }

    if ('id' in entity && 'document_type' in entity) {
      return entity as DriverDocument;
    }

    return null;
  }
}
