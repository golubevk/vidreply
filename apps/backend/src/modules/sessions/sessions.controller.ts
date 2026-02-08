import { Body, Controller, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('join')
  async initSession(
    @Body('sessionId') sessionId: string,
    @Body('identity') identity: string
  ) {
    // create session
    // create room and attach to session
    return this.sessionsService.joinSession(sessionId, identity);
  }

  @Post('start')
  async startRecording(@Body('sessionId') sessionId: string) {
    return this.sessionsService.startRecording(sessionId);
  }

  @Post('stop')
  async stopRecording(@Body('egressId') egressId: string) {
    return this.sessionsService.stopRecording(egressId);
  }
}
