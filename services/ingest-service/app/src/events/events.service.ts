import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IngestEventDto } from './dto/ingest-event.dto';
import { QueueService } from './queue.service';
import { QueuedEvent } from './schemas/queued-event.schema';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly queueService: QueueService,
    @InjectModel(QueuedEvent.name)
    private readonly queuedEventModel: Model<QueuedEvent>,
  ) {}

  async enqueue(event: IngestEventDto) {
    this.logger.log(
      `Received event for patient=${event.patientId} type=${event.type}`,
    );

    await this.queueService.publish(event);
  }

  async markEnqueued(eventId: string, enqueueResponse: unknown) {
    await this.queuedEventModel.findOneAndUpdate(
      { eventId },
      {
        $set: {
          status: 'queued',
          enqueueResponse,
          queuedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
}


