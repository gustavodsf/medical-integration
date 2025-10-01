import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueEventDto } from './dto/queue-event.dto';
import { ProcessedEvent } from './schemas/processed-event.schema';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);
  private readonly patientLocks = new Map<string, Promise<void>>();

  constructor(
    @InjectModel(ProcessedEvent.name)
    private readonly processedEventModel: Model<ProcessedEvent>,
  ) {}

  async processEvent(event: QueueEventDto): Promise<void> {
    // Ensure per-patient in-order processing
    const processingPromise = this.processWithLock(event);
    this.patientLocks.set(event.patientId, processingPromise);
    
    try {
      await processingPromise;
    } finally {
      this.patientLocks.delete(event.patientId);
    }
  }

  private async processWithLock(event: QueueEventDto): Promise<void> {
    // Wait for previous event for this patient to complete
    const existingPromise = this.patientLocks.get(event.patientId);
    if (existingPromise) {
      await existingPromise.catch(() => {
        // Ignore errors from previous processing
      });
    }

    await this.processEventInternal(event);
  }

  private async processEventInternal(event: QueueEventDto): Promise<void> {
    this.logger.log(
      `Processing eventId=${event.eventId} patient=${event.patientId} type=${event.type}`,
    );

    // Check idempotency - skip if already processed
    const existing = await this.processedEventModel.findOne({
      eventId: event.eventId,
    });

    if (existing) {
      this.logger.warn(
        `Event ${event.eventId} already processed. Skipping duplicate.`,
      );
      return;
    }

    // Simulate processing delay (~5 seconds)
    const processingStart = Date.now();
    await this.simulateProcessing();
    const processingDuration = Date.now() - processingStart;

    // Persist result (idempotent insert)
    try {
      await this.processedEventModel.create({
        eventId: event.eventId,
        patientId: event.patientId,
        type: event.type,
        data: event.data,
        ts: event.ts,
        processedAt: new Date(),
        processingDurationMs: processingDuration,
        result: {
          status: 'success',
          message: `Event processed successfully`,
        },
      });

      this.logger.log(
        `Completed eventId=${event.eventId} in ${processingDuration}ms`,
      );
    } catch (error: any) {
      // Handle duplicate key error (race condition)
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate event detected during insert: ${event.eventId}`,
        );
        return;
      }
      throw error;
    }
  }

  private async simulateProcessing(): Promise<void> {
    // Simulate ~5 seconds of processing
    const delay = 5000 + Math.random() * 1000; // 5-6 seconds
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

