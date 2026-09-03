import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrgController } from './org.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORG_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3002,
        },
      },
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
  controllers: [OrgController],
})
export class OrgModule {}
