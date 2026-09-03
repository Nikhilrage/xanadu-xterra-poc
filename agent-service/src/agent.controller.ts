import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AuthenticateAgentDto } from './dto/authenticate-agent.dto';
import { AuthorizeAgentToolDto } from './dto/authorize-agent-tool.dto';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { UpdateAgentStatusDto } from './dto/update-agent-status.dto';
import { RunAgentDto } from './dto/run-agent.dto';
import { AgentExecutionService } from './execution/agent-execution.service';

@Controller('agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly executionService: AgentExecutionService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterAgentDto) {
    return this.agentService.register(dto);
  }

  @Post('authenticate')
  authenticate(@Body() dto: AuthenticateAgentDto) {
    return this.agentService.authenticate(dto);
  }

  @Post('authorize-tool')
  authorizeTool(@Body() dto: AuthorizeAgentToolDto) {
    return this.agentService.authorizeTool(dto);
  }

  @Get(':agentId')
  getAgent(@Param('agentId') agentId: string) {
    return this.agentService.getAgent(agentId);
  }

  @Get()
  listAgents() {
    return this.agentService.listAgents();
  }

  @Patch(':agentId/status')
  updateStatus(
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentStatusDto,
  ) {
    return this.agentService.updateStatus(agentId, dto.status);
  }

  @Post(':agentId/execute')
  async runAgent(
    @Param('agentId') agentId: string,
    @Body() dto: RunAgentDto,
  ) {
    const agent = await this.agentService.getAgentEntity(agentId);
    return this.executionService.runManual(agent, dto.input, dto.payload);
  }

  @Get(':agentId/executions')
  async listExecutions(@Param('agentId') agentId: string) {
    const agentRecordId = await this.agentService.getAgentRecordId(agentId);
    return this.executionService.listAgentExecutions(agentRecordId);
  }

  @Get(':agentId/executions/:executionId')
  async getExecution(
    @Param('agentId') agentId: string,
    @Param('executionId') executionId: string,
  ) {
    const agentRecordId = await this.agentService.getAgentRecordId(agentId);
    return this.executionService.getExecution(executionId, agentRecordId);
  }
}
