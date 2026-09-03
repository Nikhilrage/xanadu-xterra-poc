import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { McpController } from './mcp.controller';
import { AgentAccessClient } from './security/agent-access.client';
import { XterraMcpService } from './xterra-mcp.service';
import { XterraToolService } from './xterra-tool.service';
import { ExecutionAuditService } from './execution-audit.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      {
        name: 'PROJECT_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3004 },
      },
      {
        name: 'AGENT_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3007 },
      },
    ]),
  ],
  controllers: [McpController],
  providers: [
    AgentAccessClient,
    XterraMcpService,
    XterraToolService,
    ExecutionAuditService,
  ],
})
export class AppModule {}
