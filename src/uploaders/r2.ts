import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { IUploader, UploadPayload, UploadResult, R2Config } from '../types';

export class R2Uploader implements IUploader {
  private client: S3Client;
  private config: R2Config;

  constructor(config: R2Config) {
    this.config = config;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(payload: UploadPayload): Promise<UploadResult> {
    const { data, fileName, mimeType } = payload;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileName,
        // AWS SDK accepts ArrayBuffer directly
        Body: data as unknown as Uint8Array,
        ContentType: mimeType,
      })
    );

    const base = this.config.publicUrl.replace(/\/$/, '');
    return {
      url: `${base}/${fileName}`,
      key: fileName,
    };
  }
}
