export interface UploadPayload {
  data: ArrayBuffer;
  fileName: string;
  mimeType: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface IUploader {
  upload(payload: UploadPayload): Promise<UploadResult>;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

export type AppLanguage = 'auto' | 'en' | 'zh';

export interface EzImageSettings {
  provider: 'r2';
  r2: R2Config;
  pathTemplate: string;
  compress: boolean;
  compressionExcludedExtensions: string[];
  maxWidth: number;
  quality: number;
  maxFileSizeMB: number;   // 0 = no limit
  stripExif: boolean;      // strip EXIF when compression is disabled
  localSaveByDefault: boolean;
  language: AppLanguage;
}

export const DEFAULT_SETTINGS: EzImageSettings = {
  provider: 'r2',
  r2: {
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    publicUrl: '',
  },
  pathTemplate: '{yyyy}/{MM}/{timestamp}-{random}.{ext}',
  compress: true,
  compressionExcludedExtensions: ['gif'],
  maxWidth: 1920,
  quality: 85,
  maxFileSizeMB: 20,
  stripExif: true,
  localSaveByDefault: false,
  language: 'auto',
};
