import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  RoomServiceClient,
  EgressClient,
  S3Upload,
  EncodedFileOutput,
  EncodedFileType,
} from 'livekit-server-sdk';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly roomClient: RoomServiceClient;
  private readonly egressClient: EgressClient;
  private readonly serverUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('LIVEKIT_WS_URL');
    const url = this.configService.get('LIVEKIT_URL');
    const apiKey = this.configService.get('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get('LIVEKIT_API_SECRET');

    if (apiKey && apiSecret) {
      this.apiKey = apiKey;
      this.apiSecret = apiSecret;
    }

    this.roomClient = new RoomServiceClient(host, apiKey, apiSecret);
    this.egressClient = new EgressClient(host, apiKey, apiSecret);
    this.serverUrl = url.replace('http://', 'ws://').replace('https://', 'wss://');
  }

  async createRoom(roomName: string) {
    return this.roomClient.createRoom({
      name: roomName,
      emptyTimeout: 60 * 10,
      maxParticipants: 10,
    });
  }

  async getToken(room: string, identity: string) {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity,
      ttl: '2h',
    });

    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return {
      token: jwt,
      serverUrl: this.serverUrl,
    };
  }

  async listRoom() {
    return [];
  }

  async deleteRoom() {
    return;
  }

  /**
   * Запуск записи комнаты с сохранением в S3
   */
  async startRoomRecording(roomName: string) {
    this.logger.log('📹 Starting recording for room:', roomName);
    this.logger.log('☁️ Using S3 storage');

    // Настройка S3 upload
    const s3Config = {
      accessKey: this.configService.get('S3_ACCESS_KEY')!,
      secret: this.configService.get('S3_SECRET_KEY')!,
      region: this.configService.get('S3_REGION')!,
      bucket: this.configService.get('S3_BUCKET')!,
      endpoint: this.configService.get('S3_ENDPOINT')!,
    };

    this.logger.log('☁️ Using AWS S3 storage');
    const s3Upload = new S3Upload(s3Config);

    // Настройка выходного файла
    const file = new EncodedFileOutput();
    file.fileType = EncodedFileType.MP4;
    file.filepath = `${roomName}/{time}.mp4`; // Путь в S3 bucket
    file.output = {
      case: 's3',
      value: s3Upload,
    };

    try {
      const egress = await this.egressClient.startRoomCompositeEgress(roomName, file, {
        layout: 'grid',
        audioOnly: false,
        videoOnly: false,
      });

      this.logger.log(`✅ Recording started, egressId: ${egress.egressId}`);

      return {
        egressId: egress.egressId,
        storage: 's3',
        bucket: this.configService.get('S3_BUCKET')!,
        path: `${roomName}/`,
      };
    } catch (error) {
      this.logger.error('❌ Failed to start recording:', error.message);
      throw error;
    }
  }

  /**
   * Остановка записи
   */
  async stopRoomRecording(egressId: string) {
    this.logger.log('⏹️ Stopping recording:', egressId);

    try {
      const info = await this.egressClient.stopEgress(egressId);

      this.logger.log('✅ Recording stopped');
      this.logger.log('📦 File saved to S3');

      return {
        success: true,
        message: 'Recording stopped and saved to S3',
        egressInfo: info,
      };
    } catch (error) {
      this.logger.error('❌ Failed to stop recording:', error.message);
      throw error;
    }
  }

  /**
   * Получение информации о записи
   */
  async getEgressInfo(egressId: string) {
    try {
      const info = await this.egressClient.listEgress({ egressId });
      return info;
    } catch (error) {
      this.logger.error('❌ Failed to get egress info:', error.message);
      throw error;
    }
  }

  /**
   * Список всех активных записей
   */
  async listActiveRecordings(roomName?: string) {
    try {
      const filter: any = { active: true };
      if (roomName) {
        filter.roomName = roomName;
      }
      const info = await this.egressClient.listEgress(filter);
      return info;
    } catch (error) {
      this.logger.error('❌ Failed to list recordings:', error.message);
      throw error;
    }
  }

  /**
   * Получение URL для скачивания записи из S3
   * (если нужен pre-signed URL для приватных файлов)
   */
  getRecordingUrl(roomName: string, filename: string): string {
    const s3Endpoint = this.configService.get('S3_ENDPOINT', 'http://localhost:9000');
    const bucket = this.configService.get('S3_BUCKET', 'livekit-recordings');

    // Публичный URL (если bucket публичный)
    return `${s3Endpoint}/${bucket}/${roomName}/${filename}`;
  }
}
