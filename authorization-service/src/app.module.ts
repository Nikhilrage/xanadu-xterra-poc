import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthorizationController } from './authorization.controller';
import { AuthorizationService } from './authorization.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AuthorizationController],
  providers: [AuthorizationService],
})
export class AppModule {}
