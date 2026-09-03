import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AgentCredentials { agentId: string; apiKey: string }

export interface RegisteredAgentDetails {
  id: string;
  agentId: string;
  ownerOrganizationId: string | null;
  tools: Array<{ key: string }>;
}

interface AuthorizationResponse {
  authenticated: boolean;
  allowed: boolean;
  agent: { agentId: string; name: string; status: string };
  toolKey: string;
}

@Injectable()
export class AgentAccessClient {
  private readonly agentServiceUrl: string;

  constructor(config: ConfigService) {
    this.agentServiceUrl = config.get<string>('AGENT_SERVICE_URL', 'http://localhost:3005');
  }

  credentials(headers: Record<string, string | string[] | undefined>): AgentCredentials {
    const agentId = this.header(headers['x-agent-id']);
    const apiKey = this.header(headers['x-api-key']);
    if (!agentId || !apiKey) throw new UnauthorizedException('x-agent-id and x-api-key headers are required');
    return { agentId, apiKey };
  }

  async authenticate(credentials: AgentCredentials) {
    return this.post('/agents/authenticate', credentials);
  }

  async authorize(credentials: AgentCredentials, toolKey: string): Promise<AuthorizationResponse> {
    const result = await this.post<AuthorizationResponse>('/agents/authorize-tool', {
      ...credentials, toolKey,
    });
    if (!result.allowed) throw new UnauthorizedException(`Agent is not authorized to execute ${toolKey}`);
    return result;
  }

  async getAgent(agentId: string): Promise<RegisteredAgentDetails> {
    const response = await fetch(`${this.agentServiceUrl}/agents/${encodeURIComponent(agentId)}`);
    if (!response.ok) throw new Error(`Agent Service ${response.status}: ${await response.text()}`);
    return (await response.json()) as RegisteredAgentDetails;
  }

  private header(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
  }

  private async post<T = unknown>(path: string, body: object): Promise<T> {
    const response = await fetch(`${this.agentServiceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const message = await response.text();
      if (response.status === 401 || response.status === 403) throw new UnauthorizedException(message);
      throw new Error(`Agent Service ${response.status}: ${message}`);
    }
    return (await response.json()) as T;
  }
}
