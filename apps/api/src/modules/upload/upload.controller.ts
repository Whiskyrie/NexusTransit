import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  StorageService,
  ImageValidationPipe,
  AvatarValidationPipe,
  MultipleImagesValidationPipe,
  UploadResult,
} from '@nexus/storage';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload single image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Image uploaded successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file format or size' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(ImageValidationPipe) file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadResult> {
    return this.storageService.uploadImage(file, folder ?? 'images');
  }

  @Post('images')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Images uploaded successfully' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleImages(
    @UploadedFiles(MultipleImagesValidationPipe) files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ): Promise<{ success: boolean; uploaded: UploadResult[]; failed: { error: string }[] }> {
    try {
      const results = await this.storageService.uploadMultipleImages(files, folder ?? 'images');
      return { success: true, uploaded: results, failed: [] };
    } catch (error) {
      return {
        success: false,
        uploaded: [],
        failed: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file format or size' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile(AvatarValidationPipe) file: Express.Multer.File,
  ): Promise<UploadResult> {
    return this.storageService.uploadImage(file, 'avatars');
  }

  @Delete(':imageUrl')
  @ApiOperation({ summary: 'Delete image and its thumbnails' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image deleted successfully' })
  async deleteImage(@Param('imageUrl') imageUrl: string): Promise<{ message: string }> {
    const decodedUrl = decodeURIComponent(imageUrl);
    await this.storageService.deleteImage(decodedUrl);
    return { message: 'Image deleted successfully' };
  }
}
