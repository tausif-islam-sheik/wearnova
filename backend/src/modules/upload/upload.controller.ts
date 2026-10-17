import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { UploadService } from './upload.service';

const ALLOWED_TYPES = ['avatar', 'product', 'category', 'banner', 'brand', 'general'] as const;
type UploadType = (typeof ALLOWED_TYPES)[number];

const TYPE_DIRS: Record<UploadType, string> = {
  avatar: 'avatars',
  product: 'products',
  category: 'categories',
  banner: 'banners',
  brand: 'brands',
  general: 'general',
};

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {
    void this.uploadService;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Upload a file (image, avatar, banner, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'avatar | product | category | banner | brand | general',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadFile(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /\/(jpg|jpeg|png|webp|gif|avif|mp4|webm|ogg|quicktime)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('type') type?: string,
  ): Promise<{ url: string; isVideo: boolean }> {
    const uploadType = (type ?? 'general') as UploadType;
    if (!ALLOWED_TYPES.includes(uploadType)) {
      throw new BadRequestException(`Invalid upload type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }

    const dir = TYPE_DIRS[uploadType];
    const destDir = join(process.cwd(), 'uploads', dir);
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

    const ext = extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(destDir, filename), file.buffer);

    const protocol = req.protocol;
    const host = req.get('host');
    const isVideo = file.mimetype.startsWith('video/');
    return { url: `${protocol}://${host}/uploads/${dir}/${filename}`, isVideo };
  }
}
