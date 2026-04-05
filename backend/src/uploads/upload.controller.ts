import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly cloudinaryService: CloudinaryService) {}

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
            fileFilter: (req, file, callback) => {
                const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf', 'image/gif', 'image/svg+xml'];
                if (allowedMimes.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.'), false);
                }
            },
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
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
