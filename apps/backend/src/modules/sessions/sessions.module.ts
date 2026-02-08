import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoomService } from '@/modules/rooms/rooms.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [ConfigModule],
  controllers: [SessionsController],
  providers: [RoomService, SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
