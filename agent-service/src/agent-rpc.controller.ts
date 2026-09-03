import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AgentService } from './agent.service';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { AgentExecutionService } from './execution/agent-execution.service';
import { RegistryService } from './registry/registry.service';
import { RunAgentDto } from './dto/run-agent.dto';

@Controller()
export class AgentRpcController {
  constructor(
    private readonly agents: AgentService,
    private readonly registry: RegistryService,
    private readonly executions: AgentExecutionService,
  ) {}

  @MessagePattern('register_agent')
  register(@Payload() dto: RegisterAgentDto) {
    return this.agents.register(dto);
  }

  @MessagePattern('list_agents')
  listAgents() {
    return this.agents.listAgents();
  }

  @MessagePattern('get_agent_details')
  getAgent(@Payload() dto: { agentId: string }) {
    return this.agents.getAgent(dto.agentId);
  }

  @MessagePattern('update_agent_status')
  updateStatus(
    @Payload() dto: { agentId: string; status: 'ACTIVE' | 'DISABLED' },
  ) {
    return this.agents.updateStatus(dto.agentId, dto.status);
  }

  @MessagePattern('run_agent_manually')
  async runAgent(
    @Payload() dto: RunAgentDto & { agentId: string },
  ) {
    const agent = await this.agents.getAgentEntity(dto.agentId);
    return this.executions.runManual(agent, dto.input, dto.payload);
  }

  @MessagePattern('list_agent_executions')
  async listExecutions(@Payload() dto: { agentId: string }) {
    const recordId = await this.agents.getAgentRecordId(dto.agentId);
    return this.executions.listAgentExecutions(recordId);
  }

  @MessagePattern('get_agent_execution')
  async getExecution(@Payload() dto: { agentId: string; executionId: string }) {
    const recordId = await this.agents.getAgentRecordId(dto.agentId);
    return this.executions.getExecution(dto.executionId, recordId);
  }

  @MessagePattern('list_agent_events')
  listEvents() {
    return this.registry.getEvents();
  }

  @MessagePattern('list_agent_tools')
  listTools() {
    return this.registry.getTools();
  }

  @MessagePattern('list_event_tools')
  listEventTools(@Payload() dto: { eventKey: string }) {
    return this.registry.getEventTools(dto.eventKey);
  }
}
