# @nexus/storage

Package de gerenciamento de armazenamento e upload de arquivos para o NexusTransit.

## 📦 Características

- ✅ **Multi-Provider**: Suporta armazenamento local e S3-compatible (Backblaze B2, Amazon S3)
- ✅ **Processamento de Imagens**: Redimensionamento automático e geração de thumbnails com Sharp
- ✅ **Validações**: Validação de tipo MIME, tamanho e extensão de arquivo
- ✅ **Segurança**: Sanitização de nomes, prevenção de path traversal, validação de conteúdo
- ✅ **Organização**: Estrutura de diretórios baseada em data (ano/mês/dia)
- ✅ **TypeScript**: Totalmente tipado com suporte completo a tipos
- ✅ **Upload Múltiplo**: Suporte para upload de múltiplos arquivos
- ✅ **Deleção Inteligente**: Remove imagens e todos os thumbnails associados

## 🚀 Instalação

```bash
pnpm add @nexus/storage
```

## 📖 Uso Básico

### 1. Configurar Módulo

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from '@nexus/storage';

@Module({
  imports: [
    StorageModule.forRoot(),
  ],
})
export class AppModule {}
```

### 2. Variáveis de Ambiente

```env
# Tipo de storage (local, s3, backblaze)
STORAGE_PROVIDER=backblaze

# Local Storage
STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_URL=http://localhost:3000/uploads

# Backblaze B2 Configuration
BACKBLAZE_ENDPOINT=https://s3.us-east-005.backblazeb2.com
BACKBLAZE_REGION=us-east-005
BACKBLAZE_ACCESS_KEY_ID=your_key_id
BACKBLAZE_SECRET_ACCESS_KEY=your_secret_key
BACKBLAZE_BUCKET=your_bucket_name
BACKBLAZE_BUCKET_REGION=us-east-005

# Amazon S3 (alternativo)
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket

# Upload Settings
MAX_FILE_SIZE=5242880  # 5MB em bytes
IMAGE_QUALITY=85       # Qualidade JPEG (0-100)
```

### 3. Usar no Controller

```typescript
import { Controller, Post, UseInterceptors, UploadedFile, UsePipes } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  StorageService, 
  FileValidationPipe,
  ImageProcessingPipe,
  UploadResult 
} from '@nexus/storage';

@Controller('upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(FileValidationPipe, ImageProcessingPipe)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResult> {
    return this.storageService.uploadImage(file, 'products');
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(FileValidationPipe)
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadFile(file, { fileType: 'documents' });
  }
}
```

## 🔧 API

### StorageService

#### `uploadImage(file, folder?, userId?): Promise<UploadResult>`

Upload de uma imagem com geração automática de thumbnails.

**Parâmetros:**
- `file`: Arquivo Multer
- `folder`: Pasta de destino (default: 'images')
- `userId`: ID do usuário (opcional, para logging)

**Retorno:**
```typescript
{
  originalUrl: string;
  thumbnails: {
    small: string;   // 150x150
    medium: string;  // 400x400
    large: string;   // 800x600
  };
  metadata: {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
}
```

#### `uploadFile(file, options?, userId?): Promise<FileUploadResult>`

Upload de arquivo genérico (documentos, PDFs, etc).

**Parâmetros:**
- `file`: Arquivo Multer
- `options.fileType`: Tipo de arquivo ('documents' | 'images' | 'proofs' | 'temp')
- `userId`: ID do usuário (opcional)

**Retorno:**
```typescript
{
  filePath: string;
  fileHash: string;
  url: string;
  metadata: FileMetadata;
}
```

#### `uploadMultipleImages(files, folder?, userId?): Promise<UploadResult[]>`

Upload múltiplo de imagens.

#### `uploadMultipleFiles(files, options?, userId?): Promise<FileUploadResult[]>`

Upload múltiplo de arquivos.

#### `deleteFile(fileKey): Promise<void>`

Deleta um arquivo.

#### `deleteImage(imageUrl): Promise<void>`

Deleta uma imagem e todos os seus thumbnails.

#### `getFileMetadata(fileKey): Promise<FileMetadata>`

Obtém metadados de um arquivo.

#### `moveFile(fileKey, newPath): Promise<void>`

Move um arquivo para novo local.

#### `copyFile(fileKey, newPath): Promise<void>`

Copia um arquivo para novo local.

### Pipes de Validação

#### `FileValidationPipe`

Valida arquivos gerais (tamanho, tipo MIME, extensão).

**Validações:**
- Tamanho máximo configurável
- Tipos MIME permitidos
- Extensões permitidas
- Prevenção de path traversal
- Nome do arquivo sem caracteres especiais

#### `ImageProcessingPipe`

Processa e otimiza imagens automaticamente.

**Operações:**
- Compressão automática
- Otimização de qualidade
- Validação de dimensões mínimas
- Remoção de metadados EXIF
- Formatos: JPEG, PNG, WebP

#### `MultipleImagesValidationPipe`

Valida múltiplas imagens de uma vez.

## ⚙️ Configuração

### Tamanhos de Thumbnails

Os tamanhos padrão são:
- **small**: 150x150px
- **medium**: 400x400px
- **large**: 800x600px

Para customizar, sobrescreva a configuração:

```typescript
StorageModule.forRootAsync({
  useFactory: () => ({
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  }),
});
```

### Tipos de Arquivo Permitidos

Padrão:
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`
- `image/svg+xml`

## 🎨 Otimizações

O package aplica automaticamente:

- ✅ Compressão JPEG (qualidade configurável)
- ✅ Compressão PNG (nível 9)
- ✅ Conversão de thumbnails para WebP
- ✅ Redimensionamento inteligente (cover + center)
- ✅ Preservação de metadados importantes

## 📝 Exemplos

### Upload Simples

```typescript
const result = await storageService.uploadImage(file);
console.log(result.originalUrl); // URL da imagem original
console.log(result.thumbnails.small); // URL do thumbnail pequeno
```

### Upload com Pasta Customizada

```typescript
const result = await storageService.uploadImage(file, 'avatars', userId);
```

### Upload Múltiplo

```typescript
const results = await storageService.uploadMultipleImages(files, 'gallery');
```

### Deletar Imagem

```typescript
await storageService.deleteImage('https://..../image.jpg');
// Deleta a imagem e todos os thumbnails automaticamente
```

## 🔒 Segurança

- ✅ Validação de tipo MIME
- ✅ Validação de extensão
- ✅ Validação de tamanho
- ✅ Sanitização de nomes de arquivo
- ✅ Geração de nomes únicos (UUID)
- ✅ Metadados de upload rastreáveis

## 🐛 Troubleshooting

### Erro: "Storage configuration not found"

Certifique-se de que as variáveis de ambiente estão configuradas corretamente.

### Erro: "File size too large"

Aumente o `MAX_FILE_SIZE` nas variáveis de ambiente ou na configuração do MulterModule.

### Erro: "Invalid file type"

Verifique se o tipo MIME do arquivo está na lista de tipos permitidos.

## 📚 Dependências

- `@aws-sdk/client-s3` - Cliente S3
- `@aws-sdk/lib-storage` - Upload multipart
- `sharp` - Processamento de imagens
- `uuid` - Geração de IDs únicos

## 📄 Licença

MIT © NexusTransit

---

**Versão:** 1.0.0
