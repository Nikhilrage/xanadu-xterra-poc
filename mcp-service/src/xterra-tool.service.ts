import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class XterraToolService {
  constructor(
    @Inject('PROJECT_SERVICE') private readonly projectClient: ClientProxy,
  ) {}

  getProjectDetails(input: {
    agentId: string;
    projectId?: string;
    projectName?: string;
  }) {
    return firstValueFrom(
      this.projectClient.send('get_project_details_for_mcp', input),
    );
  }

  getAgentProjects(agentId: string) {
    return firstValueFrom(
      this.projectClient.send('get_agent_projects_for_mcp', { agentId }),
    );
  }

  createProject(payload: {
    agentId: string;
    organizationId: string;
    creatorId: string;
    creatorRole: string;
    projectDetails: {
      name: string;
      location: string;
      reraNumber?: string;
      priceRange?: string[];
      description?: string;
    };
  }) {
    return firstValueFrom(this.projectClient.send('create_project', payload));
  }

  getLeadDetails(leadId: string) {
    return {
      id: leadId,
      name: 'POC Lead',
      status: 'NEW',
      source: 'POC_FIXTURE',
      note: 'Dummy lead data used only for the Xterra MCP POC.',
    };
  }
}
