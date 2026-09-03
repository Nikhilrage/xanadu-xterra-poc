import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AgentExecution } from '../database/agent-execution.entity';
import { AgentEvent } from '../database/agent-event.entity';
import { Event } from '../database/event.entity';
import { ExecutionToolCall } from '../database/execution-tool-call.entity';
import { Agent } from '../database/agent.entity';

export interface XterraEventMessage {
  eventKey: string;
  payload: Record<string, unknown>;
}

export interface RecordToolCallMessage {
  executionId: string;
  toolKey: string;
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown> | null;
  authorized: boolean;
  error?: string | null;
  durationMs: number;
}

@Injectable()
export class AgentExecutionService {
  constructor(
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(AgentEvent)
    private readonly agentEvents: Repository<AgentEvent>,
    @InjectRepository(AgentExecution)
    private readonly executions: Repository<AgentExecution>,
    @InjectRepository(ExecutionToolCall)
    private readonly toolCalls: Repository<ExecutionToolCall>,
  ) {}

  async handleEvent(message: XterraEventMessage) {
    const event = await this.events.findOne({
      where: { key: message.eventKey.toUpperCase(), isActive: true },
    });
    if (!event) {
      return { eventKey: message.eventKey, matchedAgents: 0, executions: [] };
    }

    const subscriptions = await this.agentEvents.find({
      where: { eventId: event.id },
      relations: { agent: true },
    });
    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.agent.status === 'ACTIVE',
    );
    const results = [];

    for (const subscription of activeSubscriptions) {
      results.push(
        await this.startExecution(
          subscription.agent.id,
          subscription.agent.agentId,
          'EVENT',
          event.key,
          message.payload,
        ),
      );
    }

    return {
      eventKey: event.key,
      matchedAgents: activeSubscriptions.length,
      executions: results,
    };
  }

  async runManual(
    agent: Agent,
    input?: string,
    payload: Record<string, unknown> = {},
  ) {
    if (agent.status !== 'ACTIVE') {
      throw new BadRequestException('Only active agents can be executed');
    }
    if (agent.executionMode !== 'MANUAL') {
      throw new BadRequestException('Agent is not configured for manual execution');
    }

    return this.startExecution(
      agent.id,
      agent.agentId,
      'MANUAL',
      null,
      { ...payload, input: input ?? null },
    );
  }

  async listAgentExecutions(agentRecordId: string) {
    return this.executions.find({
      where: { agentId: agentRecordId },
      order: { createdAt: 'DESC' },
    });
  }

  async getExecution(executionId: string, agentRecordId?: string) {
    const execution = await this.executions.findOne({
      where: { id: executionId },
    });
    if (!execution || (agentRecordId && execution.agentId !== agentRecordId)) {
      throw new NotFoundException('Execution not found');
    }
    const toolCalls = await this.toolCalls.find({
      where: { executionId },
      order: { calledAt: 'ASC' },
    });
    return { ...execution, toolCalls };
  }

  async recordToolCall(message: RecordToolCallMessage) {
    const execution = await this.executions.findOne({
      where: { id: message.executionId },
    });
    if (!execution) throw new NotFoundException('Execution not found');
    return this.toolCalls.save({
      executionId: message.executionId,
      toolKey: message.toolKey,
      requestPayload: message.requestPayload,
      responsePayload: message.responsePayload ?? null,
      authorized: message.authorized,
      error: message.error ?? null,
      durationMs: message.durationMs,
    });
  }

  private async startExecution(
    agentRecordId: string,
    agentId: string,
    triggerSource: 'EVENT' | 'MANUAL',
    eventKey: string | null,
    payload: Record<string, unknown>,
  ) {
    const execution = await this.executions.save({
      runCode: `RUN-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`,
      agentId: agentRecordId,
      triggerSource,
      triggerEventKey: eventKey,
      eventPayload: payload,
      status: 'PENDING',
      result: null,
      error: null,
      startedAt: null,
      completedAt: null,
    });
    return {
      executionId: execution.id,
      agentId,
      status: 'PENDING',
      message: 'Execution created and ready for the agent MCP client',
    };
  }
}
