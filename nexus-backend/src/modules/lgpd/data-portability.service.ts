import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

interface UserDataExport {
  exportInfo: {
    userId: string;
    exportDate: string;
    exportVersion: string;
    description: string;
  };
  userData: Record<string, unknown>;
  auditLogs: unknown[];
  consents: unknown[];
  dataRequests: unknown[];
}

@Injectable()
export class DataPortabilityService {
  /**
   * Exporta todos os dados de um usuário em formato JSON
   */
  async exportUserData(userId: string): Promise<{
    filePath: string;
    fileHash: string;
    fileSize: number;
  }> {
    try {
      // Coleta dados de todas as tabelas relacionadas ao usuário
      const userData = this.collectUserData(userId);

      // Gera nome único para o arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `user-data-export-${userId}-${timestamp}.json`;
      const exportDir = path.join(process.cwd(), 'exports');
      const filePath = path.join(exportDir, fileName);

      // Garante que o diretório existe
      await fs.mkdir(exportDir, { recursive: true });

      // Cria o arquivo JSON formatado
      const jsonData = JSON.stringify(userData, null, 2);
      await fs.writeFile(filePath, jsonData, 'utf8');

      // Calcula hash e tamanho do arquivo
      const fileBuffer = await fs.readFile(filePath);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const fileSize = fileBuffer.length;

      return {
        filePath,
        fileHash,
        fileSize,
      };
    } catch (error) {
      throw new Error(
        `Erro ao exportar dados do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Coleta todos os dados relacionados a um usuário
   */
  private collectUserData(userId: string): UserDataExport {
    const userData = {
      exportInfo: {
        userId,
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
        description: 'Exportação completa de dados pessoais conforme LGPD',
      },
      userData: {},
      auditLogs: [],
      consents: [],
      dataRequests: [],
    };

    try {
      // Aqui você implementaria a coleta de dados de cada tabela
      // Por enquanto, retorna estrutura básica

      // TODO: Implementar coleta de dados reais das tabelas:
      // - users
      // - user_roles
      // - audit_logs
      // - user_consents
      // - data_requests
      // - deliveries (como cliente ou motorista)
      // - routes
      // - vehicles (se for motorista)
      // - incidents
      // - tracking data

      userData.userData = {
        message:
          'Implementação da coleta de dados será adicionada conforme as entidades específicas do projeto',
        tables: [
          'users',
          'user_roles',
          'audit_logs',
          'user_consents',
          'data_requests',
          'deliveries',
          'routes',
          'vehicles',
          'incidents',
          'tracking',
        ],
      };

      return userData;
    } catch (error) {
      throw new Error(
        `Erro ao coletar dados do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Verifica se um arquivo de exportação existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove arquivo de exportação após download
   */
  async deleteExportFile(filePath: string): Promise<void> {
    try {
      if (await this.fileExists(filePath)) {
        await fs.unlink(filePath);
      }
    } catch {
      // Silenciosamente ignora erro ao deletar arquivo
    }
  }

  /**
   * Limpa arquivos de exportação antigos (mais de 7 dias)
   */
  async cleanupOldExports(): Promise<number> {
    try {
      const exportDir = path.join(process.cwd(), 'exports');
      const files = await fs.readdir(exportDir);

      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('user-data-export-')) {
          const filePath = path.join(exportDir, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch {
      return 0;
    }
  }

  /**
   * Valida integridade de um arquivo usando hash
   */
  async validateFileIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
    try {
      if (!(await this.fileExists(filePath))) {
        return false;
      }

      const fileBuffer = await fs.readFile(filePath);
      const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      return actualHash === expectedHash;
    } catch {
      return false;
    }
  }

  /**
   * Obtém informações de um arquivo de exportação
   */
  async getExportFileInfo(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    created?: Date;
    hash?: string;
  }> {
    try {
      if (!(await this.fileExists(filePath))) {
        return { exists: false };
      }

      const stats = await fs.stat(filePath);
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        hash,
      };
    } catch {
      return { exists: false };
    }
  }
}
