import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
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
                const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
                if (allowedMimes.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
                }
            },
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const result = await this.cloudinaryService.uploadFile(file);
        return { url: result.secure_url };
    }
}
