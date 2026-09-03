import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { DataSource, In, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { AgentEvent } from './database/agent-event.entity';
import { AgentTool } from './database/agent-tool.entity';
import { Agent } from './database/agent.entity';
import { EventTool } from './database/event-tool.entity';
import { Event } from './database/event.entity';
import { Tool } from './database/tool.entity';
import { AuthenticateAgentDto } from './dto/authenticate-agent.dto';
import { AuthorizeAgentToolDto } from './dto/authorize-agent-tool.dto';
import { RegisterAgentDto } from './dto/register-agent.dto';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Agent) private readonly agents: Repository<Agent>,
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(Tool) private readonly tools: Repository<Tool>,
    @InjectRepository(EventTool)
    private readonly eventTools: Repository<EventTool>,
    @InjectRepository(AgentEvent)
    private readonly agentEvents: Repository<AgentEvent>,
    @InjectRepository(AgentTool)
    private readonly agentTools: Repository<AgentTool>,
    private readonly dataSource: DataSource,
    @Inject('AUTHORIZATION_SERVICE') private readonly authorization: ClientProxy,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterAgentDto) {
    const eventIds = [...new Set(dto.eventIds ?? [])];
    const toolIds = [...new Set(dto.toolIds)];
    if (dto.executionMode === 'AUTOMATIC' && !eventIds.length) {
      throw new BadRequestException(
        'At least one event is required for automatic execution',
      );
    }
    if (dto.executionMode === 'MANUAL' && eventIds.length) {
      throw new BadRequestException(
        'Manual execution must not contain event selections',
      );
    }

    const selectedEvents = eventIds.length
      ? await this.events.findBy({
          id: In(eventIds),
          isActive: true,
        })
      : [];
    const selectedTools = await this.tools.findBy({
      id: In(toolIds),
      status: 'ACTIVE',
    });

    if (selectedEvents.length !== eventIds.length) {
      throw new BadRequestException('One or more selected events are invalid or inactive');
    }
    if (selectedTools.length !== toolIds.length) {
      throw new BadRequestException('One or more selected tools are invalid or inactive');
    }

    if (dto.executionMode === 'AUTOMATIC') {
      const relevantMappings = await this.eventTools.findBy({
        eventId: In(eventIds),
        toolId: In(toolIds),
      });
      const relevantToolIds = new Set(
        relevantMappings.map((mapping) => mapping.toolId),
      );
      const irrelevantTools = selectedTools.filter(
        (tool) => !relevantToolIds.has(tool.id),
      );
      if (irrelevantTools.length) {
        throw new BadRequestException(
          `Tools not relevant to selected events: ${irrelevantTools.map((tool) => tool.key).join(', ')}`,
        );
      }
    }

    const toolKeys = selectedTools.map((tool) => tool.key);
    const agentId = `AGT-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const apiKey = `xta_live_${randomBytes(32).toString('base64url')}`;
    let agent: Agent | undefined;

    try {
      agent = await this.dataSource.transaction(async (manager) => {
        const savedAgent = await manager.save(Agent, {
          agentId,
          name: dto.name,
          description: dto.description,
          type: dto.type,
          ownerOrganizationId: dto.ownerOrganizationId ?? null,
          executionMode: dto.executionMode,
          runtimeUrl: null,
          status: 'ACTIVE',
          apiKeyPrefix: apiKey.slice(0, 16),
          apiKeyHash: this.hash(apiKey),
          lastUsedAt: null,
        });

        if (eventIds.length) {
          await manager.save(
            AgentEvent,
            eventIds.map((eventId) => ({ agentId: savedAgent.id, eventId })),
          );
        }
        await manager.save(
          AgentTool,
          toolIds.map((toolId) => ({ agentId: savedAgent.id, toolId })),
        );

        return savedAgent;
      });

      await firstValueFrom(
        this.authorization.send('sync_agent_tool_permissions', { agentId, toolKeys }),
      );
    } catch (error) {
      if (agent) await this.agents.delete(agent.id);
      throw error;
    }

    return {
      message: 'Agent registered successfully',
      agent: {
        ...this.profile(agent),
        events: selectedEvents.map((event) => this.eventResponse(event)),
        tools: selectedTools.map((tool) => this.toolResponse(tool)),
      },
      credentials: { apiKey, shownOnlyOnce: true },
      mcpConfiguration: {
        mcpServers: {
          xterra: {
            url: this.config.get<string>('MCP_SERVER_URL', 'http://localhost:3006/mcp'),
            headers: { 'x-agent-id': agentId, 'x-api-key': apiKey },
          },
        },
      },
    };
  }

  async authenticate(dto: AuthenticateAgentDto) {
    const agent = await this.agents.findOne({ where: { agentId: dto.agentId } });
    if (!agent || agent.status !== 'ACTIVE') throw new UnauthorizedException('Invalid or inactive agent credentials');
    if (!this.hashMatches(dto.apiKey, agent.apiKeyHash)) {
      throw new UnauthorizedException('Invalid or inactive agent credentials');
    }
    await this.agents.update(agent.id, { lastUsedAt: new Date() });
    return { authenticated: true, agent: this.profile(agent) };
  }

  async authorizeTool(dto: AuthorizeAgentToolDto) {
    const authentication = await this.authenticate(dto);
    const { allowed } = await firstValueFrom<{ allowed: boolean }>(
      this.authorization.send('check_agent_tool_access', {
        agentId: dto.agentId,
        toolKey: dto.toolKey,
      }),
    );
    return { authenticated: true, allowed, agent: authentication.agent, toolKey: dto.toolKey };
  }

  async getAgent(agentId: string) {
    const agent = await this.agents.findOne({ where: { agentId } });
    if (!agent) throw new NotFoundException('Agent not found');
    const [eventMappings, toolMappings] = await Promise.all([
      this.agentEvents.find({
        where: { agentId: agent.id },
        relations: { event: true },
      }),
      this.agentTools.find({
        where: { agentId: agent.id },
        relations: { tool: true },
      }),
    ]);
    return {
      ...this.profile(agent),
      events: eventMappings.map((mapping) => this.eventResponse(mapping.event)),
      tools: toolMappings.map((mapping) => this.toolResponse(mapping.tool)),
    };
  }

  async listAgents() {
    const agents = await this.agents.find({ order: { createdAt: 'DESC' } });
    return agents.map((agent) => this.profile(agent));
  }

  async updateStatus(agentId: string, status: 'ACTIVE' | 'DISABLED') {
    const agent = await this.findAgent(agentId);
    await this.agents.update(agent.id, { status });
    return { message: `Agent ${status.toLowerCase()} successfully`, status };
  }

  async getAgentRecordId(agentId: string) {
    return (await this.findAgent(agentId)).id;
  }

  getAgentEntity(agentId: string) {
    return this.findAgent(agentId);
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }

  private hashMatches(value: string, expectedHex: string) {
    const actual = Buffer.from(this.hash(value), 'hex');
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private profile(agent: Agent) {
    return {
      id: agent.id, agentId: agent.agentId, name: agent.name, description: agent.description,
      type: agent.type, ownerOrganizationId: agent.ownerOrganizationId,
      executionMode: agent.executionMode,
      status: agent.status,
      createdAt: agent.createdAt,
    };
  }

  private eventResponse(event: Event) {
    return { id: event.id, key: event.key, name: event.name };
  }

  private toolResponse(tool: Tool) {
    return {
      id: tool.id,
      key: tool.key,
      name: tool.name,
      category: tool.category,
    };
  }

  private async findAgent(agentId: string) {
    const agent = await this.agents.findOne({ where: { agentId } });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }
}
