import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';

@Controller('upload')
export class UploadController {
    @Post()
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, callback) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    callback(null, `file-${uniqueSuffix}${ext}`);
                },
            }),
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        const url = `/uploads/${file.filename}`;
        return { url };
    }
}
