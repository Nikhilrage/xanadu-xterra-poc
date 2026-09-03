import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { Agent } from './database/agent.entity';
import { AgentEvent } from './database/agent-event.entity';
import { AgentExecution } from './database/agent-execution.entity';
import { AgentTool } from './database/agent-tool.entity';
import { ExecutionToolCall } from './database/execution-tool-call.entity';
import { EventTool } from './database/event-tool.entity';
import { Event } from './database/event.entity';
import { Tool } from './database/tool.entity';
import { RegistryController } from './registry/registry.controller';
import { RegistryService } from './registry/registry.service';
import { AgentEventController } from './execution/agent-event.controller';
import { AgentExecutionService } from './execution/agent-execution.service';
import { AgentRpcController } from './agent-rpc.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 9200),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', '12345'),
        database: config.get<string>('DB_DATABASE', 'agent_db'),
        entities: [
          Agent,
          AgentEvent,
          AgentTool,
          AgentExecution,
          ExecutionToolCall,
          Event,
          Tool,
          EventTool,
        ],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([
      Agent,
      AgentEvent,
      AgentTool,
      AgentExecution,
      ExecutionToolCall,
      Event,
      Tool,
      EventTool,
    ]),
    ClientsModule.register([
      {
        name: 'AUTHORIZATION_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3003 },
      },
    ]),
  ],
  controllers: [
    AgentController,
    RegistryController,
    AgentEventController,
    AgentRpcController,
  ],
  providers: [AgentService, RegistryService, AgentExecutionService],
})
export class AppModule {}
