import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { QueueEventDto } from './dto/queue-event.dto';

@Controller('queue')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receiveEvent(@Body() event: QueueEventDto) {
    // Fire and forget - process asynchronously
    this.workerService.processEvent(event).catch((err) => {
      console.error(`Failed to process event ${event.eventId}:`, err);
    });
    return { status: 'accepted' };
  }
}

