import { Injectable, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AgentAccessClient, AgentCredentials } from './security/agent-access.client';
import { XterraToolService } from './xterra-tool.service';
import { ExecutionAuditService } from './execution-audit.service';

@Injectable()
export class XterraMcpService {
  private readonly logger = new Logger(XterraMcpService.name);

  constructor(
    private readonly access: AgentAccessClient,
    private readonly tools: XterraToolService,
    private readonly audit: ExecutionAuditService,
  ) {}

  async createServer(credentials: AgentCredentials, executionId?: string) {
    const agent = await this.access.getAgent(credentials.agentId);
    const selectedToolKeys = new Set(agent.tools.map((tool) => tool.key));
    const server = new McpServer(
      { name: 'xterra-mcp', version: '0.1.0' },
      { instructions: 'Use Xterra tools only for the registered agent. Every tool call is authorized independently.' },
    );

    if (selectedToolKeys.has('create_project')) {
      const inputSchema: any = {
        name: z.string().min(1),
        location: z.string().min(1),
        reraNumber: z.string().optional(),
        priceRange: z.array(z.string()).optional(),
        description: z.string().optional(),
      };
      server.registerTool(
        'create_project',
        {
          description: 'Create a project in Xterra.',
          inputSchema,
        },
        async (args: any) => this.executeTool(
          credentials,
          executionId,
          'create_project',
          args,
          () => {
            if (!agent.ownerOrganizationId) {
              throw new Error('Agent does not have an owner organization');
            }
            return this.tools.createProject({
              agentId: agent.agentId,
              organizationId: agent.ownerOrganizationId,
              creatorId: agent.id,
              creatorRole: 'agent',
              projectDetails: {
                name: args.name,
                location: args.location,
                reraNumber: args.reraNumber,
                priceRange: args.priceRange,
                description: args.description,
              },
            });
          },
        ),
      );
    }

    if (selectedToolKeys.has('get_agent_projects')) {
      server.registerTool(
        'get_agent_projects',
        {
          description: 'List only projects created by the authenticated agent in its registered organization.',
          inputSchema: {},
        },
        async () => this.executeTool(
          credentials,
          executionId,
          'get_agent_projects',
          {},
          () => this.tools.getAgentProjects(agent.agentId),
        ),
      );
    }

    if (selectedToolKeys.has('get_project_details')) {
      const inputSchema: any = {
        projectId: z.string().uuid().optional(),
        projectName: z.string().min(1).optional(),
      };
      server.registerTool(
        'get_project_details',
        {
          description: 'Retrieve one project by ID, or find all projects whose names contain the supplied text. Provide projectId or projectName.',
          inputSchema,
        },
        async (args: any) => {
          return this.executeTool(
            credentials,
            executionId,
            'get_project_details',
            args,
            () => this.tools.getProjectDetails({
              agentId: agent.agentId,
              projectId: args.projectId,
              projectName: args.projectName,
            }),
          );
        },
      );
    }

    if (selectedToolKeys.has('get_lead_details')) {
      const inputSchema: any = { leadId: z.string().min(1) };
      server.registerTool(
        'get_lead_details',
        {
          description: 'Retrieve POC fixture data for a lead by lead ID.',
          inputSchema,
        },
        async (args: any) => {
          return this.executeTool(
            credentials,
            executionId,
            'get_lead_details',
            args,
            () => this.tools.getLeadDetails(args.leadId),
          );
        },
      );
    }

    return server;
  }

  private result(value: unknown) {
    const structuredContent = value as Record<string, unknown>;
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify(structuredContent) },
      ],
      structuredContent,
    };
  }

  private async executeTool(
    credentials: AgentCredentials,
    executionId: string | undefined,
    toolKey: string,
    requestPayload: Record<string, unknown>,
    handler: () => unknown | Promise<unknown>,
  ) {
    const startedAt = Date.now();
    let authorized = false;
    try {
      await this.access.authorize(credentials, toolKey);
      authorized = true;
      const value = await handler();
      await this.audit.record({
        executionId,
        toolKey,
        requestPayload,
        responsePayload: value as Record<string, unknown>,
        authorized,
        durationMs: Date.now() - startedAt,
      });
      return this.result(value);
    } catch (error) {
      const message = this.errorMessage(error);
      this.logger.error(`Tool ${toolKey} failed: ${message}`);
      await this.audit.record({
        executionId,
        toolKey,
        requestPayload,
        responsePayload: null,
        authorized,
        error: message,
        durationMs: Date.now() - startedAt,
      });
      throw new Error(message);
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const value = error as Record<string, unknown>;
      for (const key of ['message', 'error', 'detail']) {
        const candidate = value[key];
        if (typeof candidate === 'string' && candidate) return candidate;
        if (candidate && typeof candidate === 'object') {
          const nested = this.errorMessage(candidate);
          if (nested !== 'Unknown MCP tool error') return nested;
        }
      }
    }
    return 'Unknown MCP tool error';
  }
}
