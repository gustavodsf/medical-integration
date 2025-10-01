import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { ProcessedEvent, ProcessedEventSchema } from './schemas/processed-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ProcessedEvent.name,
        schema: ProcessedEventSchema,
      },
    ]),
  ],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}

