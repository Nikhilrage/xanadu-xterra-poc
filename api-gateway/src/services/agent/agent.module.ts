import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AgentController } from './agent.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AGENT_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3007 },
      },
    ]),
  ],
  controllers: [AgentController],
})
export class AgentModule {}
