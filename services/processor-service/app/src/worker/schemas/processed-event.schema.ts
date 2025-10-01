import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProcessedEventDocument = HydratedDocument<ProcessedEvent>;

@Schema({ timestamps: true, collection: 'processed_events' })
export class ProcessedEvent {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true, index: true })
  patientId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ type: Object, required: true })
  data!: Record<string, unknown>;

  @Prop({ required: true })
  ts!: string;

  @Prop({ type: Date, required: true })
  processedAt!: Date;

  @Prop({ type: Number })
  processingDurationMs?: number;

  @Prop({ type: Object })
  result?: {
    status: string;
    message: string;
    error?: string;
  };
}

export const ProcessedEventSchema = SchemaFactory.createForClass(ProcessedEvent);

// Compound index for patient ordering queries
ProcessedEventSchema.index({ patientId: 1, ts: 1 });

