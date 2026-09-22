import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { CloudinaryService } from './cloudinary.service';

const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const AUTH_UPLOAD_MIMES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'application/pdf',
  'image/gif',
];

const PUBLIC_UPLOAD_MIMES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];

function uploadInterceptor(allowedMimes: string[]) {
  return FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: UPLOAD_MAX_BYTES },
    fileFilter: (_req, file, callback) => {
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Invalid file type.'), false);
      }
    },
  });
}

@Controller('upload')
export class UploadController {
    constructor(private readonly cloudinaryService: CloudinaryService) {}

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @Throttle({ default: { limit: 40, ttl: 60000 } })
    @UseInterceptors(uploadInterceptor(AUTH_UPLOAD_MIMES))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.handleUpload(file);
    }

    /** Signup KYC/logo only — registration itself is Turnstile-gated; keep rate limits tight. */
    @Post('public')
    @Throttle({ default: { limit: 12, ttl: 60000 } })
    @UseInterceptors(uploadInterceptor(PUBLIC_UPLOAD_MIMES))
    async uploadPublicFile(@UploadedFile() file: Express.Multer.File) {
        return this.handleUpload(file);
    }

    private async handleUpload(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('UPLOAD_MISSING: No file part found in request. Use "file" as the key.');
        }

        try {
            const result = await this.cloudinaryService.uploadFile(file);
            if (!result || (result as any).error) {
                console.error('CLOUDINARY_REJECTED:', result);
                throw new Error((result as any).error?.message || 'External storage failed to process file.');
            }
            return { url: result.secure_url };
        } catch (error: any) {
            console.error('UPLOAD_FINAL_CRASH:', error);
            throw new InternalServerErrorException(
                `STORAGE_FAILURE: ${error.message || 'Unknown backend error during visual asset storage.'}`
            );
        }
    }
}
