import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || '';

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      this.logger.warn('R2 Credentials missing. File upload will fail.');
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!this.s3Client) {
      throw new Error('R2 Client not initialized');
    }

    const key = `uploads/${uuidv4()}-${file.originalname}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      this.logger.log(`File uploaded to R2: ${key}`);
      return key;
    } catch (e) {
      this.logger.error(`R2 Upload Failed: ${e.message}`);
      throw e;
    }
  }
}
