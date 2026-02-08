import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return { response: 'LiveKit WebRTC - NestJS Backend' };
  }
}
