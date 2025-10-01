import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EventsService } from './events.service';
import { IngestEventDto } from './dto/ingest-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(@Body() event: IngestEventDto) {
    await this.eventsService.enqueue(event);
    return { status: 'queued' };
  }
}


