import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import {
  ApprovalService,
  CreateProjectApprovalDto,
  UpdateProjectChecksDto,
} from "./approval.service";

@Controller("approval")
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get("health")
  health() {
    return {
      ok: true,
      service: "approval-service",
    };
  }

  @Post("projects")
  createProjectAndRunApproval(@Body() dto: CreateProjectApprovalDto) {
    return this.approvalService.createProjectApproval(dto);
  }

  @Patch("projects/:processInstanceId/checks")
  updateProjectChecks(
    @Param("processInstanceId") processInstanceId: string,
    @Body() dto: UpdateProjectChecksDto,
  ) {
    return this.approvalService.updateProjectChecks(processInstanceId, dto);
  }

  @Get("processes/:processInstanceId")
  getProcess(@Param("processInstanceId") processInstanceId: string) {
    return this.approvalService.getProcessStatus(processInstanceId);
  }
}
