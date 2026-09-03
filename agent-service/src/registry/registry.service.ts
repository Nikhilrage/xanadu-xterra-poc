import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventTool } from '../database/event-tool.entity';
import { Event } from '../database/event.entity';
import { Tool } from '../database/tool.entity';
import { EVENT_REGISTRY_SEED, TOOL_REGISTRY_SEED } from './registry.seed';

@Injectable()
export class RegistryService implements OnModuleInit {
  constructor(
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(Tool) private readonly tools: Repository<Tool>,
    @InjectRepository(EventTool)
    private readonly eventTools: Repository<EventTool>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async getEvents() {
    const events = await this.events.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const mappings = events.length
      ? await this.eventTools.find({
          where: { eventId: In(events.map((event) => event.id)) },
          relations: { tool: true },
        })
      : [];

    return events.map((event) => ({
      id: event.id,
      key: event.key,
      name: event.name,
      description: event.description,
      tools: mappings
        .filter(
          (mapping) =>
            mapping.eventId === event.id && mapping.tool.status === 'ACTIVE',
        )
        .map((mapping) => this.toolResponse(mapping.tool)),
    }));
  }

  async getEventTools(eventKey: string) {
    const event = await this.events.findOne({
      where: { key: eventKey.toUpperCase(), isActive: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const mappings = await this.eventTools.find({
      where: { eventId: event.id },
      relations: { tool: true },
    });

    return {
      event: {
        id: event.id,
        key: event.key,
        name: event.name,
        description: event.description,
      },
      tools: mappings
        .filter((mapping) => mapping.tool.status === 'ACTIVE')
        .map((mapping) => this.toolResponse(mapping.tool)),
    };
  }

  async getTools() {
    const tools = await this.tools.find({
      where: { status: 'ACTIVE' },
      order: { name: 'ASC' },
    });
    return tools.map((tool) => this.toolResponse(tool));
  }

  private async seed() {
    await this.tools.update(
      { key: 'get_customer_profile' },
      { status: 'INACTIVE' },
    );
    await this.tools.upsert(
      TOOL_REGISTRY_SEED.map((tool) => ({ ...tool, status: 'ACTIVE' as const })),
      ['key'],
    );
    await this.events.upsert(
      EVENT_REGISTRY_SEED.map(({ toolKeys: _toolKeys, ...event }) => ({
        ...event,
        isActive: true,
      })),
      ['key'],
    );

    const events = await this.events.findBy({
      key: In(EVENT_REGISTRY_SEED.map((event) => event.key)),
    });
    const tools = await this.tools.findBy({
      key: In(TOOL_REGISTRY_SEED.map((tool) => tool.key)),
    });
    const eventsByKey = new Map(events.map((event) => [event.key, event]));
    const toolsByKey = new Map(tools.map((tool) => [tool.key, tool]));

    for (const seedEvent of EVENT_REGISTRY_SEED) {
      const event = eventsByKey.get(seedEvent.key);
      if (!event) continue;

      await this.eventTools.delete({ eventId: event.id });

      for (const toolKey of seedEvent.toolKeys) {
        const tool = toolsByKey.get(toolKey);
        if (!tool) continue;

        await this.eventTools.upsert(
          { eventId: event.id, toolId: tool.id },
          ['eventId', 'toolId'],
        );
      }
    }
  }

  private toolResponse(tool: Tool) {
    return {
      id: tool.id,
      key: tool.key,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      status: tool.status,
    };
  }
}
