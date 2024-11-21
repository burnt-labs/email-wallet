import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  signAndSendTransaction(): string {
    return 'Hello World!';
  }
}
