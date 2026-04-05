import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinaryClient: any) {}

  uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file || !file.buffer) {
        throw new Error('CORRUPT_BUFFER: File data is missing or corrupted.');
    }
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream((error, result) => {
        if (error) {
            console.error('CLOUDINARY_STREAM_ERROR:', error);
            return reject(error);
        }
        if (result) resolve(result);
      });

      streamifier.createReadStream(file.buffer).on('error', (err) => {
          console.error('STREAMIFIER_ERROR:', err);
          reject(err);
      }).pipe(upload);
    });
  }
}
