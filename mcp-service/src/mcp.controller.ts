import { All, Controller, HttpCode, Req, Res } from '@nestjs/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { AgentAccessClient } from './security/agent-access.client';
import { XterraMcpService } from './xterra-mcp.service';

@Controller()
export class McpController {
  constructor(
    private readonly access: AgentAccessClient,
    private readonly xterraMcp: XterraMcpService,
  ) {}

  @All('mcp')
  @HttpCode(200)
  async handle(@Req() request: Request, @Res() response: Response) {
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Only Streamable HTTP POST is supported' });
    }

    const credentials = this.access.credentials(request.headers);
    await this.access.authenticate(credentials);

    const executionIdHeader = request.headers['x-execution-id'];
    const executionId = Array.isArray(executionIdHeader)
      ? executionIdHeader[0]
      : executionIdHeader;
    const server = await this.xterraMcp.createServer(credentials, executionId);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    response.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  }
}
