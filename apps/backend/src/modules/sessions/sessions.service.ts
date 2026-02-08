import { Inject, Injectable, Logger } from '@nestjs/common';

import { RoomService } from '@/modules/rooms/rooms.service';

@Injectable()
export class SessionsService {
  @Inject()
  private readonly roomsService: RoomService;
  private readonly logger = new Logger(SessionsService.name);

  async joinSession(sessionId: string, identity: string) {
    this.logger.log(`Join recording: ${sessionId}`);

    // create room
    const room = await this.roomsService.createRoom(sessionId);

    // upsert session logic

    return this.roomsService.getToken(room.name, identity);
  }

  async startRecording(sessionId: string) {
    this.logger.log(`Start recording: ${sessionId}`);

    return this.roomsService.startRoomRecording(sessionId);
  }

  async stopRecording(egressId: string) {
    this.logger.log(`Stop recording: ${egressId}`);

    return this.roomsService.stopRoomRecording(egressId);
  }
}
