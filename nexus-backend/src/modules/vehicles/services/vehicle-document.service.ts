import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleDocument } from '../entities/vehicle-document.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { generateFileUrl, FileValidationUtils } from '../config/upload.config';
import { CreateVehicleDocumentDto } from '../dto/create-vehicle-document.dto';
import { promises as fs } from 'fs';

export interface UploadedFileInfo {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

@Injectable()
export class VehicleDocumentService {
  private readonly logger = new Logger(VehicleDocumentService.name);

  constructor(
    @InjectRepository(VehicleDocument)
    private readonly vehicleDocumentRepository: Repository<VehicleDocument>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async uploadDocument(
    vehicleId: string,
    file: Express.Multer.File,
    documentData: CreateVehicleDocumentDto,
  ): Promise<VehicleDocument> {
    // Validate vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      // Clean up uploaded file if vehicle doesn't exist
      await this.deleteFile(file.path);
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    // Validate file
    if (!FileValidationUtils.validateMimeType(file.mimetype)) {
      await this.deleteFile(file.path);
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    // Create file info
    const fileInfo: UploadedFileInfo = {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: generateFileUrl(file.filename),
    };

    // Format file size
    const fileSizeFormatted = this.formatFileSize(fileInfo.size);

    // Create document record
    const document = this.vehicleDocumentRepository.create({
      document_type: documentData.documentType,
      vehicle,
      original_name: fileInfo.originalname,
      file_path: fileInfo.path,
      file_url: fileInfo.url,
      file_size: fileSizeFormatted,
      file_size_bytes: fileInfo.size,
      mime_type: fileInfo.mimetype,
      file_extension: this.getFileExtension(fileInfo.originalname),
      expiration_date: documentData.expirationDate,
      description: documentData.description,
      issued_by: documentData.issuedBy,
      reference_number: documentData.referenceNumber,
    });

    const savedDocument = await this.vehicleDocumentRepository.save(document);

    this.logger.log(
      `Documento ${savedDocument.document_type} carregado para veículo ${vehicle.license_plate} (${vehicleId})`,
    );

    return savedDocument;
  }

  async getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado`);
    }

    return this.vehicleDocumentRepository.find({
      where: { vehicle: { id: vehicleId } },
      order: { created_at: 'DESC' },
    });
  }

  async getDocument(documentId: string): Promise<VehicleDocument> {
    const document = await this.vehicleDocumentRepository.findOne({
      where: { id: documentId },
      relations: ['vehicle'],
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID ${documentId} não encontrado`);
    }

    return document;
  }

  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.getDocument(documentId);

    // Delete physical file
    await this.deleteFile(document.file_path);

    // Delete database record
    await this.vehicleDocumentRepository.remove(document);

    this.logger.log(`Documento ${documentId} removido com sucesso`);
  }

  async updateDocument(
    documentId: string,
    updateData: Partial<CreateVehicleDocumentDto>,
  ): Promise<VehicleDocument> {
    const document = await this.getDocument(documentId);

    // Update allowed fields
    if (updateData.description !== undefined) {
      document.description = updateData.description;
    }
    if (updateData.expirationDate !== undefined) {
      document.expiration_date = updateData.expirationDate;
    }
    if (updateData.issuedBy !== undefined) {
      document.issued_by = updateData.issuedBy;
    }
    if (updateData.referenceNumber !== undefined) {
      document.reference_number = updateData.referenceNumber;
    }

    return this.vehicleDocumentRepository.save(document);
  }

  async getDocumentsByType(vehicleId: string, documentType: string): Promise<VehicleDocument[]> {
    return this.vehicleDocumentRepository.find({
      where: {
        vehicle: { id: vehicleId },
        document_type: documentType as any,
      },
      order: { created_at: 'DESC' },
    });
  }

  async checkDocumentExpiration(vehicleId: string): Promise<VehicleDocument[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.vehicleDocumentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.vehicle', 'vehicle')
      .where('vehicle.id = :vehicleId', { vehicleId })
      .andWhere('document.expiration_date IS NOT NULL')
      .andWhere('document.expiration_date <= :expirationDate', {
        expirationDate: thirtyDaysFromNow,
      })
      .orderBy('document.expiration_date', 'ASC')
      .getMany();
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.debug(`Arquivo físico removido: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Erro ao remover arquivo físico ${filePath}:`, error);
      // Don't throw error - the file might already be deleted or not exist
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  // Future method for Backblaze B2 integration
  private async _uploadToBackblazeB2(_file: Express.Multer.File): Promise<string> {
    // TODO: Implement Backblaze B2 upload
    // This will replace local file storage in the future
    throw new Error('Backblaze B2 integration not implemented yet');
  }

  // Method to migrate existing files to B2 (future)
  async migrateToBackblazeB2(): Promise<void> {
    // TODO: Implement migration from local storage to Backblaze B2
    this.logger.log('Backblaze B2 migration not implemented yet');
  }
}
