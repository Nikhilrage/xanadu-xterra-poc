import { Controller, Get, Param } from '@nestjs/common';
import { RegistryService } from './registry.service';

@Controller('registry')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Get('events')
  getEvents() {
    return this.registryService.getEvents();
  }

  @Get('events/:eventKey/tools')
  getEventTools(@Param('eventKey') eventKey: string) {
    return this.registryService.getEventTools(eventKey);
  }

  @Get('tools')
  getTools() {
    return this.registryService.getTools();
  }
}
