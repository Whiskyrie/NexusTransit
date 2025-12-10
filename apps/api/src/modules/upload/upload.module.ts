import { Module } from '@nestjs/common';
import { StorageModule } from '@nexus/storage';
import { UploadController } from './upload.controller';

@Module({
  imports: [StorageModule.forRoot()],
  controllers: [UploadController],
})
export class UploadModule {}
