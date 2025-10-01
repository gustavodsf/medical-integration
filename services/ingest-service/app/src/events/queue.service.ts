import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { IngestEventDto } from './dto/ingest-event.dto';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly processorUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.processorUrl = configService.getOrThrow<string>('PROCESSOR_URL');
  }

  async publish(event: IngestEventDto) {
    const eventId = randomUUID();
    const payload = { eventId, ...event };
    this.logger.debug(
      `Publishing eventId=${eventId} patient=${event.patientId} to processor`,
    );

    const observable = this.httpService.post(
      `${this.processorUrl}/queue`,
      payload,
    );
    await firstValueFrom(observable);

    return eventId;
  }
}


