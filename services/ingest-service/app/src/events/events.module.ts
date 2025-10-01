import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { QueueService } from './queue.service';
import { QueuedEvent, QueuedEventSchema } from './schemas/queued-event.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: QueuedEvent.name,
        schema: QueuedEventSchema,
      },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, QueueService],
})
export class EventsModule {}


