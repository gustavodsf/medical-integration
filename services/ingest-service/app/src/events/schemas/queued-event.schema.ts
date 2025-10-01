import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QueuedEventDocument = HydratedDocument<QueuedEvent>;

@Schema({ timestamps: true, collection: 'queued_events' })
export class QueuedEvent {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true })
  patientId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ type: Object, required: true })
  data!: Record<string, unknown>;

  @Prop({ required: true })
  ts!: string;

  @Prop({ required: true })
  status!: 'queued' | 'failed' | 'processed';

  @Prop({ type: Date })
  queuedAt?: Date;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop({ type: Object })
  enqueueResponse?: unknown;
}

export const QueuedEventSchema = SchemaFactory.createForClass(QueuedEvent);

QueuedEventSchema.index({ patientId: 1, ts: 1 });


