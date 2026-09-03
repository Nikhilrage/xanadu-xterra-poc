import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../../jwt/jwt-auth.guard';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(
    @Inject('AGENT_SERVICE') private readonly agentClient: ClientProxy,
  ) {}

  @Post('register')
  register(@Body() dto: any) {
    return this.agentClient.send('register_agent', dto);
  }

  @Get()
  listAgents() {
    return this.agentClient.send('list_agents', {});
  }

  @Get('events')
  listEvents() {
    return this.agentClient.send('list_agent_events', {});
  }

  @Get('tools')
  listTools() {
    return this.agentClient.send('list_agent_tools', {});
  }

  @Get('events/:eventKey/tools')
  listEventTools(@Param('eventKey') eventKey: string) {
    return this.agentClient.send('list_event_tools', { eventKey });
  }

  @Get(':agentId')
  getAgent(@Param('agentId') agentId: string) {
    return this.agentClient.send('get_agent_details', { agentId });
  }

  @Patch(':agentId/status')
  updateStatus(@Param('agentId') agentId: string, @Body() dto: any) {
    return this.agentClient.send('update_agent_status', {
      agentId,
      status: dto.status,
    });
  }

  @Post(':agentId/execute')
  runAgent(@Param('agentId') agentId: string, @Body() dto: any) {
    return this.agentClient.send('run_agent_manually', {
      agentId,
      ...dto,
    });
  }

  @Get(':agentId/executions')
  listExecutions(@Param('agentId') agentId: string) {
    return this.agentClient.send('list_agent_executions', { agentId });
  }

  @Get(':agentId/executions/:executionId')
  getExecution(
    @Param('agentId') agentId: string,
    @Param('executionId') executionId: string,
  ) {
    return this.agentClient.send('get_agent_execution', {
      agentId,
      executionId,
    });
  }
}
