import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProjectController } from './project.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROJECT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3004,
        },
      },
    ]),
  ],
  controllers: [ProjectController],
})
export class ProjectModule {}
