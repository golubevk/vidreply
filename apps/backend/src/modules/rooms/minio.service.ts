import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

/**
 * Дополнительный сервис для работы с MinIO напрямую
 * Используйте для:
 * - Генерации pre-signed URLs
 * - Управления файлами
 * - Получения метаданных
 * - Настройки bucket policies
 */
@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get('MINIO_ENDPOINT', 'http://minio:9000');
    const accessKey = this.configService.get('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = this.configService.get('MINIO_SECRET_KEY', 'minioadmin123');
    this.bucketName = this.configService.get('MINIO_BUCKET', 'livekit-recordings');

    // Парсим endpoint
    const url = new URL(endpoint);
    const useSSL = url.protocol === 'https:';
    const port = url.port ? parseInt(url.port) : useSSL ? 443 : 9000;

    this.minioClient = new Minio.Client({
      endPoint: url.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    this.logger.log(`MinIO client initialized: ${url.hostname}:${port}`);
  }

  /**
   * Проверка существования bucket
   */
  async bucketExists(): Promise<boolean> {
    try {
      return await this.minioClient.bucketExists(this.bucketName);
    } catch (error) {
      this.logger.error('Error checking bucket existence:', error);
      return false;
    }
  }

  /**
   * Создание bucket если не существует
   */
  async ensureBucket(): Promise<void> {
    const exists = await this.bucketExists();
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      this.logger.log(`Bucket ${this.bucketName} created`);
    }
  }

  /**
   * Получение pre-signed URL для скачивания (приватный bucket)
   * @param objectKey - путь к файлу в S3
   * @param expiresIn - время действия URL в секундах (по умолчанию 1 час)
   */
  async getPresignedDownloadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(this.bucketName, objectKey, expiresIn);
    } catch (error) {
      this.logger.error(`Error generating presigned URL for ${objectKey}:`, error);
      throw error;
    }
  }

  /**
   * Получение pre-signed URL для загрузки (если нужно дать клиенту возможность загружать)
   */
  async getPresignedUploadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await this.minioClient.presignedPutObject(this.bucketName, objectKey, expiresIn);
    } catch (error) {
      this.logger.error(`Error generating upload URL for ${objectKey}:`, error);
      throw error;
    }
  }

  /**
   * Список файлов в директории
   * @param prefix - префикс (например, "room-123/")
   */
  async listFiles(
    prefix?: string
  ): Promise<Array<{ name: string; size: number; lastModified: Date }>> {
    const files: Array<{ name: string; size: number; lastModified: Date }> = [];

    return new Promise((resolve, reject) => {
      const stream = this.minioClient.listObjects(this.bucketName, prefix, true);

      stream.on('data', (obj) => {
        if (obj.name) {
          files.push({
            name: obj.name,
            size: obj.size || 0,
            lastModified: obj.lastModified || new Date(),
          });
        }
      });

      stream.on('end', () => {
        resolve(files);
      });

      stream.on('error', (error) => {
        this.logger.error('Error listing files:', error);
        reject(error);
      });
    });
  }

  /**
   * Получение метаданных файла
   */
  async getFileMetadata(objectKey: string) {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, objectKey);
      return {
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        metaData: stat.metaData,
        contentType: stat.metaData?.['content-type'],
      };
    } catch (error) {
      this.logger.error(`Error getting metadata for ${objectKey}:`, error);
      throw error;
    }
  }

  /**
   * Удаление файла
   */
  async deleteFile(objectKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectKey);
      this.logger.log(`File deleted: ${objectKey}`);
    } catch (error) {
      this.logger.error(`Error deleting ${objectKey}:`, error);
      throw error;
    }
  }

  /**
   * Удаление всех файлов в директории
   */
  async deleteDirectory(prefix: string): Promise<void> {
    const files = await this.listFiles(prefix);
    const objectsList = files.map((file) => file.name);

    if (objectsList.length > 0) {
      try {
        await this.minioClient.removeObjects(this.bucketName, objectsList);
        this.logger.log(`Deleted ${objectsList.length} files from ${prefix}`);
      } catch (error) {
        this.logger.error(`Error deleting directory ${prefix}:`, error);
        throw error;
      }
    }
  }

  /**
   * Копирование файла
   */
  async copyFile(sourceKey: string, destKey: string): Promise<void> {
    try {
      await this.minioClient.copyObject(
        this.bucketName,
        destKey,
        `/${this.bucketName}/${sourceKey}`
      );
      this.logger.log(`File copied: ${sourceKey} -> ${destKey}`);
    } catch (error) {
      this.logger.error(`Error copying ${sourceKey} to ${destKey}:`, error);
      throw error;
    }
  }

  /**
   * Получение статистики использования
   */
  async getBucketStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    sizeFormatted: string;
  }> {
    const files = await this.listFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      totalFiles: files.length,
      totalSize: totalSize,
      sizeFormatted: this.formatBytes(totalSize),
    };
  }

  /**
   * Настройка bucket policy для публичного доступа
   */
  async makeBucketPublic(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    };

    try {
      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      this.logger.log(`Bucket ${this.bucketName} is now public`);
    } catch (error) {
      this.logger.error('Error setting bucket policy:', error);
      throw error;
    }
  }

  /**
   * Установка lifecycle правил (например, автоудаление старых файлов)
   */
  async setLifecycleRules(daysToExpire: number = 30): Promise<void> {
    const lifecycleConfig = {
      Rule: [
        {
          ID: 'DeleteOldRecordings',
          Status: 'Enabled',
          Expiration: {
            Days: daysToExpire,
          },
        },
      ],
    };

    try {
      await this.minioClient.setBucketLifecycle(this.bucketName, lifecycleConfig);
      this.logger.log(`Lifecycle rule set: delete after ${daysToExpire} days`);
    } catch (error) {
      this.logger.error('Error setting lifecycle:', error);
      throw error;
    }
  }

  /**
   * Форматирование размера файла
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Получение публичного URL (для публичных bucket)
   */
  getPublicUrl(objectKey: string): string {
    const endpoint = this.configService.get('MINIO_PUBLIC_ENDPOINT', 'http://localhost:9000');
    return `${endpoint}/${this.bucketName}/${objectKey}`;
  }
}

/**
 * Пример использования в контроллере:
 *
 * @Controller('recordings')
 * export class RecordingsController {
 *   constructor(
 *     private readonly roomService: RoomService,
 *     private readonly minioService: MinioService,
 *   ) {}
 *
 *   @Get(':roomName')
 *   async getRecordings(@Param('roomName') roomName: string) {
 *     const files = await this.minioService.listFiles(`${roomName}/`);
 *
 *     return files.map(file => ({
 *       name: file.name,
 *       size: file.size,
 *       lastModified: file.lastModified,
 *       url: this.minioService.getPublicUrl(file.name),
 *       // Или для приватного доступа:
 *       // url: await this.minioService.getPresignedDownloadUrl(file.name),
 *     }));
 *   }
 *
 *   @Delete(':roomName/:filename')
 *   async deleteRecording(
 *     @Param('roomName') roomName: string,
 *     @Param('filename') filename: string,
 *   ) {
 *     await this.minioService.deleteFile(`${roomName}/${filename}`);
 *     return { success: true };
 *   }
 *
 *   @Get('stats')
 *   async getStats() {
 *     return await this.minioService.getBucketStats();
 *   }
 * }
 */
