import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectService } from './project.service';
import type {
  CreateProjectDto,
  DeleteProjectDto,
  GetAllProjectsDto,
  GetCpAssignedProjectsDto,
  GetProjectDto,
  AssignCpOrganisationDto,
  CountProjectsByOrganizationsDto,
  UpdateCpOrganisationAssignmentDto,
  UpdateProjectDto,
} from './project.service';

@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @MessagePattern('create_project')
  createProject(@Payload() dto: CreateProjectDto) {
    return this.projectService.createProject(dto);
  }

  @MessagePattern('get_all_projects')
  getAllProjects(@Payload() dto: GetAllProjectsDto) {
    return this.projectService.getAllProjects(dto);
  }

  @MessagePattern('get_cp_assigned_projects')
  getCpAssignedProjects(@Payload() dto: GetCpAssignedProjectsDto) {
    return this.projectService.getCpAssignedProjects(dto);
  }

  @MessagePattern('count_projects_by_organizations')
  countProjectsByOrganizations(@Payload() dto: CountProjectsByOrganizationsDto) {
    return this.projectService.countProjectsByOrganizations(dto);
  }

  @MessagePattern('assign_cp_organisation_to_project')
  assignCpOrganisationToProject(@Payload() dto: AssignCpOrganisationDto) {
    return this.projectService.assignCpOrganisationToProject(dto);
  }

  @MessagePattern('update_cp_organisation_assignment')
  updateCpOrganisationAssignment(@Payload() dto: UpdateCpOrganisationAssignmentDto) {
    return this.projectService.updateCpOrganisationAssignment(dto);
  }

  @MessagePattern('get_project')
  getProject(@Payload() dto: GetProjectDto) {
    return this.projectService.getProject(dto);
  }

  @MessagePattern('update_project')
  updateProject(@Payload() dto: UpdateProjectDto) {
    return this.projectService.updateProject(dto);
  }

  @MessagePattern('delete_project')
  deleteProject(@Payload() dto: DeleteProjectDto) {
    return this.projectService.deleteProject(dto);
  }

  @MessagePattern('get_project_details_for_mcp')
  getProjectDetailsForMcp(
    @Payload() dto: { agentId: string; projectId?: string; projectName?: string },
  ) {
    return this.projectService.getProjectDetailsForMcp(dto);
  }

  @MessagePattern('get_agent_projects_for_mcp')
  getAgentProjectsForMcp(@Payload() dto: { agentId: string }) {
    return this.projectService.getAgentProjectsForMcp(dto.agentId);
  }

  @MessagePattern('create_dummy_lead')
  createDummyLead(
    @Payload() dto: { leadId?: string; name?: string; projectId?: string },
  ) {
    return this.projectService.createDummyLead(dto);
  }
}
