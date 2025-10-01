import {
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
} from 'class-validator';

export class QueueEventDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  type!: string;

  @IsObject()
  data!: Record<string, unknown>;

  @IsISO8601()
  ts!: string;
}

