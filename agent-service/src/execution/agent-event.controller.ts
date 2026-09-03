import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AgentExecutionService,
  RecordToolCallMessage,
  XterraEventMessage,
} from './agent-execution.service';

@Controller()
export class AgentEventController {
  constructor(private readonly executions: AgentExecutionService) {}

  @MessagePattern('publish_xterra_event')
  publishEvent(@Payload() message: XterraEventMessage) {
    return this.executions.handleEvent(message);
  }

  @MessagePattern('record_execution_tool_call')
  recordToolCall(@Payload() message: RecordToolCallMessage) {
    return this.executions.recordToolCall(message);
  }
}
