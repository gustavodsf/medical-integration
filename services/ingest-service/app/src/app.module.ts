import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
        serverSelectionTimeoutMS: config.get<number>('MONGO_TIMEOUT_MS', 5000),
      }),
    }),
    EventsModule,
    HealthModule,
  ],
})
export class AppModule {}
