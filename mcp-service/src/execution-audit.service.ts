import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export interface ToolCallAudit {
  executionId?: string;
  toolKey: string;
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown> | null;
  authorized: boolean;
  error?: string | null;
  durationMs: number;
}

@Injectable()
export class ExecutionAuditService {
  constructor(
    @Inject('AGENT_SERVICE') private readonly agentClient: ClientProxy,
  ) {}

  async record(audit: ToolCallAudit) {
    if (!audit.executionId) return;
    try {
      await firstValueFrom(
        this.agentClient.send('record_execution_tool_call', audit),
      );
    } catch {
      // Audit persistence must not change the MCP tool result.
    }
  }
}
