import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom, timeout } from 'rxjs';
import { ILike, In, Repository } from 'typeorm';
import { ProjectCpAssignment } from './database/project-cp-assignment.entity';
import { Project } from './database/project.entity';

interface AccessCheckResponse {
  allowed: boolean;
}

interface OrganizationSummary {
  id: string;
  name: string;
  type: string;
}

interface ProjectDetails {
  name: string;
  location: string;
  reraNumber?: string;
  priceRange?: string[];
  description?: string;
}

interface ProjectDetailsUpdate {
  name?: string;
  location?: string;
  reraNumber?: string | null;
  priceRange?: string[] | null;
  description?: string | null;
}

export interface CreateProjectDto {
  agentId?: string;
  organizationId: string;
  creatorId: string;
  creatorRole: string;
  project_details?: ProjectDetails;
  projectDetails?: ProjectDetails;
}

export interface GetAllProjectsDto {
  organizationId: string;
  userId: string;
}

export interface GetCpAssignedProjectsDto {
  cpOrganizationId: string;
  userId: string;
}

export interface CountProjectsByOrganizationsDto {
  organizationIds: string[];
}

export interface GetProjectDto {
  projectId: string;
  userId: string;
}

export interface AssignCpOrganisationDto extends GetProjectDto {
  cpOrganizationId: string;
}

export interface UpdateCpOrganisationAssignmentDto extends GetProjectDto {
  oldCpOrganizationId?: string;
  newCpOrganizationId: string;
}

export interface UpdateProjectDto extends GetProjectDto {
  project_details?: ProjectDetailsUpdate;
  projectDetails?: ProjectDetailsUpdate;
}

export type DeleteProjectDto = GetProjectDto;

@Injectable()
export class ProjectService {
  constructor(
    @Inject('AUTHORIZATION_SERVICE')
    private readonly authorizationClient: ClientProxy,

    @Inject('ORG_SERVICE')
    private readonly orgClient: ClientProxy,

    @Inject('AGENT_SERVICE')
    private readonly agentClient: ClientProxy,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectCpAssignment)
    private readonly projectCpAssignmentRepository: Repository<ProjectCpAssignment>,
  ) {}

  async createProject(dto: CreateProjectDto) {
    const projectDetails = dto.project_details ?? dto.projectDetails;

    if (!projectDetails?.name || !projectDetails?.location) {
      throw new RpcException('Project name and location are required');
    }

    if (!dto.organizationId || !dto.creatorId || !dto.creatorRole) {
      throw new RpcException(
        'Organization ID, creator ID, and creator role are required',
      );
    }

    if (dto.creatorRole === 'agent') {
      await this.ensureAgentContext(dto.agentId, dto.organizationId, dto.creatorId, 'create_project');
    } else {
      const access = await firstValueFrom<AccessCheckResponse>(
        this.authorizationClient.send('check_developer_organisation_access', {
          organizationId: dto.organizationId,
          userId: dto.creatorId,
        }),
      );

      if (!access.allowed) {
        throw new RpcException(
          'You do not have access to create projects for this organisation',
        );
      }
    }

    let project: Project | undefined;
    let authorizationSyncAttempted = false;

    try {
      project = await this.projectRepository.save({
        name: projectDetails.name,
        location: projectDetails.location,
        reraNumber: projectDetails.reraNumber ?? null,
        priceRange: projectDetails.priceRange ?? null,
        description: projectDetails.description ?? null,
        organizationId: dto.organizationId,
        creatorId: dto.creatorId,
        creatorRole: dto.creatorRole,
      });

      authorizationSyncAttempted = true;
      await firstValueFrom(
        this.authorizationClient.send('sync_project_owner', {
          projectId: project.id,
          organizationId: dto.organizationId,
        }),
      );

      const eventDispatch = await this.dispatchEvent('PROJECT_CREATED', {
        projectId: project.id,
        organizationId: project.organizationId,
        name: project.name,
        location: project.location,
      });

      return {
        message: 'Project created successfully',
        project,
        eventDispatch,
      };
    } catch (error) {
      const rollbackErrors: string[] = [];

      if (authorizationSyncAttempted && project) {
        try {
          await firstValueFrom(
            this.authorizationClient.send('remove_project_owner', {
              projectId: project.id,
              organizationId: dto.organizationId,
            }),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      if (project) {
        try {
          await this.projectRepository.delete(project.id);
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      const rollbackMessage =
        rollbackErrors.length > 0
          ? ` Rollback errors: ${rollbackErrors.join('; ')}`
          : '';

      throw new RpcException(
        `${this.getErrorMessage(error)}${rollbackMessage}`,
      );
    }
  }

  async getAllProjects(dto: GetAllProjectsDto) {
    if (!dto.organizationId || !dto.userId) {
      throw new RpcException('Organization ID and user ID are required');
    }

    await this.ensureDeveloperOrganisationAccess(
      dto.organizationId,
      dto.userId,
    );

    const projects = await this.projectRepository.find({
      where: {
        organizationId: dto.organizationId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return this.withCpAssignments(projects);
  }

  async getCpAssignedProjects(dto: GetCpAssignedProjectsDto) {
    if (!dto.cpOrganizationId || !dto.userId) {
      throw new RpcException('CP organization ID and user ID are required');
    }

    await this.ensureCpOrganisationAccess(dto.cpOrganizationId, dto.userId);

    const assignments = await this.projectCpAssignmentRepository.find({
      where: {
        cpOrganizationId: dto.cpOrganizationId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!assignments.length) {
      return [];
    }

    const projects = await this.projectRepository.find({
      where: {
        id: In(assignments.map((assignment) => assignment.projectId)),
      },
    });

    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const visibleProjects: Project[] = [];

    for (const assignment of assignments) {
      const project = projectsById.get(assignment.projectId);

      if (
        project &&
        (await this.hasProjectPermission(project.id, dto.userId, 'can_view'))
      ) {
        visibleProjects.push(project);
      }
    }

    return this.withCpAssignments(visibleProjects);
  }

  async countProjectsByOrganizations(dto: CountProjectsByOrganizationsDto) {
    if (!dto.organizationIds?.length) {
      return {
        projectCount: 0,
      };
    }

    return {
      projectCount: await this.projectRepository.count({
        where: {
          organizationId: In(dto.organizationIds),
        },
      }),
    };
  }

  async assignCpOrganisationToProject(dto: AssignCpOrganisationDto) {
    this.validateProjectRequest(dto);

    if (!dto.cpOrganizationId) {
      throw new RpcException('CP organization ID is required');
    }

    await this.ensureProjectPermission(dto.projectId, dto.userId, 'can_edit');
    const project = await this.findProjectOrThrow(dto.projectId);

    let assignment: ProjectCpAssignment | undefined;
    let authorizationSyncAttempted = false;

    try {
      assignment = await this.projectCpAssignmentRepository.save({
        projectId: project.id,
        cpOrganizationId: dto.cpOrganizationId,
        assignedBy: dto.userId,
      });

      authorizationSyncAttempted = true;
      await firstValueFrom(
        this.authorizationClient.send('sync_project_cp_assignment', {
          projectId: project.id,
          cpOrganizationId: dto.cpOrganizationId,
        }),
      );

      return {
        message: 'CP organisation assigned to project successfully',
        project,
        assignment,
      };
    } catch (error) {
      const rollbackErrors: string[] = [];

      if (authorizationSyncAttempted) {
        try {
          await firstValueFrom(
            this.authorizationClient.send('remove_project_cp_assignment', {
              projectId: project.id,
              cpOrganizationId: dto.cpOrganizationId,
            }),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      if (assignment) {
        try {
          await this.projectCpAssignmentRepository.delete(assignment.id);
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      const rollbackMessage =
        rollbackErrors.length > 0
          ? ` Rollback errors: ${rollbackErrors.join('; ')}`
          : '';

      throw new RpcException(
        `${this.getErrorMessage(error)}${rollbackMessage}`,
      );
    }
  }

  async updateCpOrganisationAssignment(dto: UpdateCpOrganisationAssignmentDto) {
    this.validateProjectRequest(dto);

    if (!dto.newCpOrganizationId) {
      throw new RpcException('New CP organization ID is required');
    }

    await this.ensureProjectPermission(dto.projectId, dto.userId, 'can_edit');
    const project = await this.findProjectOrThrow(dto.projectId);

    const existingAssignment = await this.projectCpAssignmentRepository.findOne({
      where: dto.oldCpOrganizationId
        ? {
            projectId: project.id,
            cpOrganizationId: dto.oldCpOrganizationId,
          }
        : {
            projectId: project.id,
          },
      order: {
        createdAt: 'ASC',
      },
    });

    if (!existingAssignment) {
      throw new RpcException('CP assignment not found for this project');
    }

    const oldCpOrganizationId = existingAssignment.cpOrganizationId;

    if (oldCpOrganizationId === dto.newCpOrganizationId) {
      return {
        message: 'CP organisation assignment already up to date',
        project,
        assignment: existingAssignment,
      };
    }

    let oldTupleRemoved = false;
    let newTupleSynced = false;

    try {
      await firstValueFrom(
        this.authorizationClient.send('remove_project_cp_assignment', {
          projectId: project.id,
          cpOrganizationId: oldCpOrganizationId,
        }),
      );
      oldTupleRemoved = true;

      existingAssignment.cpOrganizationId = dto.newCpOrganizationId;
      existingAssignment.assignedBy = dto.userId;
      const updatedAssignment =
        await this.projectCpAssignmentRepository.save(existingAssignment);

      await firstValueFrom(
        this.authorizationClient.send('sync_project_cp_assignment', {
          projectId: project.id,
          cpOrganizationId: dto.newCpOrganizationId,
        }),
      );
      newTupleSynced = true;

      return {
        message: 'CP organisation assignment updated successfully',
        project,
        assignment: updatedAssignment,
      };
    } catch (error) {
      const rollbackErrors: string[] = [];

      if (newTupleSynced) {
        try {
          await firstValueFrom(
            this.authorizationClient.send('remove_project_cp_assignment', {
              projectId: project.id,
              cpOrganizationId: dto.newCpOrganizationId,
            }),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      if (oldTupleRemoved) {
        try {
          await firstValueFrom(
            this.authorizationClient.send('sync_project_cp_assignment', {
              projectId: project.id,
              cpOrganizationId: oldCpOrganizationId,
            }),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      const rollbackMessage =
        rollbackErrors.length > 0
          ? ` Rollback errors: ${rollbackErrors.join('; ')}`
          : '';

      throw new RpcException(
        `${this.getErrorMessage(error)}${rollbackMessage}`,
      );
    }
  }

  async getProject(dto: GetProjectDto) {
    this.validateProjectRequest(dto);
    await this.ensureProjectPermission(dto.projectId, dto.userId, 'can_view');

    const project = await this.findProjectOrThrow(dto.projectId);

    return this.withCpAssignment(project);
  }

  async getProjectDetailsForMcp(dto: {
    agentId: string;
    projectId?: string;
    projectName?: string;
  }) {
    const agent = await this.ensureAgentContext(dto.agentId, undefined, undefined, 'get_project_details');
    if (dto.projectId) {
      const project = await this.projectRepository.findOne({
        where: {
          id: dto.projectId,
          organizationId: agent.ownerOrganizationId,
          creatorId: agent.id,
          creatorRole: 'agent',
        },
      });
      if (!project) throw new RpcException('Agent project not found');
      return this.withCpAssignment(project);
    }

    const projectName = dto.projectName?.trim();
    if (!projectName) {
      throw new RpcException('Project ID or project name is required');
    }

    const projects = await this.projectRepository.find({
      where: {
        name: ILike(`%${projectName}%`),
        organizationId: agent.ownerOrganizationId,
        creatorId: agent.id,
        creatorRole: 'agent',
      },
      order: { createdAt: 'DESC' },
    });
    return {
      query: projectName,
      count: projects.length,
      projects: await Promise.all(
        projects.map((project) => this.withCpAssignment(project)),
      ),
    };
  }

  async getAgentProjectsForMcp(agentId: string) {
    const agent = await this.ensureAgentContext(
      agentId,
      undefined,
      undefined,
      'get_agent_projects',
    );
    const projects = await this.projectRepository.find({
      where: {
        organizationId: agent.ownerOrganizationId,
        creatorId: agent.id,
        creatorRole: 'agent',
      },
      order: { createdAt: 'DESC' },
    });
    return {
      count: projects.length,
      projects: await Promise.all(
        projects.map((project) => this.withCpAssignment(project)),
      ),
    };
  }

  private async ensureAgentContext(
    agentId: string | undefined,
    expectedOrganizationId: string | undefined,
    expectedAgentRecordId: string | undefined,
    toolKey: string,
  ): Promise<{
    id: string;
    agentId: string;
    ownerOrganizationId: string;
    status: string;
  }> {
    if (!agentId) throw new RpcException('Agent ID is required');

    const agent = await firstValueFrom<{
      id: string;
      agentId: string;
      ownerOrganizationId: string | null;
      status: string;
    }>(this.agentClient.send('get_agent_details', { agentId }));

    if (agent.status !== 'ACTIVE' || !agent.ownerOrganizationId) {
      throw new RpcException('Agent is inactive or has no owner organization');
    }
    if (
      expectedOrganizationId &&
      expectedOrganizationId !== agent.ownerOrganizationId
    ) {
      throw new RpcException(
        'Agent is not authorized for the requested organization',
      );
    }
    if (expectedAgentRecordId && expectedAgentRecordId !== agent.id) {
      throw new RpcException('Invalid agent creator identity');
    }

    const access = await firstValueFrom<AccessCheckResponse>(
      this.authorizationClient.send('check_agent_tool_access', {
        agentId: agent.agentId,
        toolKey,
      }),
    );
    if (!access.allowed) {
      throw new RpcException(`Agent cannot execute ${toolKey}`);
    }
    return {
      ...agent,
      ownerOrganizationId: agent.ownerOrganizationId,
    };
  }

  async createDummyLead(dto: { leadId?: string; name?: string; projectId?: string }) {
    const lead = {
      id: dto.leadId ?? `LEAD-${Date.now()}`,
      name: dto.name ?? 'POC Lead',
      projectId: dto.projectId ?? null,
      status: 'NEW',
      source: 'POC_FIXTURE',
    };
    const eventDispatch = await this.dispatchEvent('LEAD_CREATED', lead);
    return {
      message: 'Dummy lead created successfully',
      lead,
      eventDispatch,
    };
  }

  async updateProject(dto: UpdateProjectDto) {
    this.validateProjectRequest(dto);
    const projectDetails = dto.project_details ?? dto.projectDetails;

    if (!projectDetails || !this.hasAnyProjectDetailsUpdate(projectDetails)) {
      throw new RpcException('At least one project field is required');
    }

    await this.ensureProjectPermission(dto.projectId, dto.userId, 'can_edit');
    const project = await this.findProjectOrThrow(dto.projectId);

    if (projectDetails.name !== undefined) {
      project.name = projectDetails.name;
    }

    if (projectDetails.location !== undefined) {
      project.location = projectDetails.location;
    }

    if (projectDetails.reraNumber !== undefined) {
      project.reraNumber = projectDetails.reraNumber;
    }

    if (projectDetails.priceRange !== undefined) {
      project.priceRange = projectDetails.priceRange;
    }

    if (projectDetails.description !== undefined) {
      project.description = projectDetails.description;
    }

    return {
      message: 'Project updated successfully',
      project: await this.projectRepository.save(project),
    };
  }

  async deleteProject(dto: DeleteProjectDto) {
    this.validateProjectRequest(dto);
    await this.ensureProjectPermission(dto.projectId, dto.userId, 'can_delete');
    const project = await this.findProjectOrThrow(dto.projectId);
    const cpAssignments = await this.projectCpAssignmentRepository.find({
      where: {
        projectId: project.id,
      },
    });
    let ownershipRemovalAttempted = false;
    const removedCpAssignments: ProjectCpAssignment[] = [];

    try {
      for (const assignment of cpAssignments) {
        await firstValueFrom(
          this.authorizationClient.send('remove_project_cp_assignment', {
            projectId: project.id,
            cpOrganizationId: assignment.cpOrganizationId,
          }),
        );
        removedCpAssignments.push(assignment);
      }

      ownershipRemovalAttempted = true;
      await firstValueFrom(
        this.authorizationClient.send('remove_project_owner', {
          projectId: project.id,
          organizationId: project.organizationId,
        }),
      );

      await this.projectCpAssignmentRepository.delete({
        projectId: project.id,
      });
      await this.projectRepository.delete(project.id);

      return {
        message: 'Project deleted successfully',
      };
    } catch (error) {
      const rollbackErrors: string[] = [];

      if (ownershipRemovalAttempted) {
        try {
          await firstValueFrom(
            this.authorizationClient.send('sync_project_owner', {
              projectId: project.id,
              organizationId: project.organizationId,
            }),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      for (const assignment of removedCpAssignments) {
        try {
          await firstValueFrom(
            this.authorizationClient.send('sync_project_cp_assignment', {
              projectId: project.id,
              cpOrganizationId: assignment.cpOrganizationId,
            }),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      const rollbackMessage =
        rollbackErrors.length > 0
          ? ` Rollback errors: ${rollbackErrors.join('; ')}`
          : '';

      throw new RpcException(
        `${this.getErrorMessage(error)}${rollbackMessage}`,
      );
    }
  }

  private async ensureDeveloperOrganisationAccess(
    organizationId: string,
    userId: string,
  ) {
    const access = await firstValueFrom<AccessCheckResponse>(
      this.authorizationClient.send('check_developer_organisation_access', {
        organizationId,
        userId,
      }),
    );

    if (!access.allowed) {
      throw new RpcException(
        'You do not have access to projects for this organisation',
      );
    }
  }

  private async dispatchEvent(
    eventKey: string,
    payload: Record<string, unknown>,
  ) {
    try {
      return await firstValueFrom(
        this.agentClient
          .send('publish_xterra_event', { eventKey, payload })
          .pipe(timeout(2000)),
      );
    } catch (error) {
      return {
        eventKey,
        dispatched: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  private async ensureCpOrganisationAccess(
    cpOrganizationId: string,
    userId: string,
  ) {
    const access = await firstValueFrom<AccessCheckResponse>(
      this.authorizationClient.send('check_cp_organisation_access', {
        cpOrganizationId,
        userId,
      }),
    );

    if (!access.allowed) {
      throw new RpcException(
        'You do not have access to projects for this CP organisation',
      );
    }
  }

  private async ensureProjectPermission(
    projectId: string,
    userId: string,
    permission: 'can_view' | 'can_edit' | 'can_delete',
  ) {
    const allowed = await this.hasProjectPermission(projectId, userId, permission);

    if (!allowed) {
      throw new RpcException(`You do not have ${permission} access`);
    }
  }

  private async hasProjectPermission(
    projectId: string,
    userId: string,
    permission: 'can_view' | 'can_edit' | 'can_delete',
  ) {
    const access = await firstValueFrom<AccessCheckResponse>(
      this.authorizationClient.send('check_project_permission', {
        projectId,
        userId,
        permission,
      }),
    );

    return access.allowed;
  }

  private async findProjectOrThrow(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new RpcException('Project not found');
    }

    return project;
  }

  private async withCpAssignment(project: Project) {
    const projects = await this.withCpAssignments([project]);

    return projects[0];
  }

  private async withCpAssignments(projects: Project[]) {
    if (!projects.length) {
      return [];
    }

    const assignments = await this.projectCpAssignmentRepository.find({
      where: {
        projectId: In(projects.map((project) => project.id)),
      },
      order: {
        createdAt: 'ASC',
      },
    });
    const cpOrganizationIds = [
      ...new Set(assignments.map((assignment) => assignment.cpOrganizationId)),
    ];
    const cpOrganizations = cpOrganizationIds.length
      ? await firstValueFrom<OrganizationSummary[]>(
          this.orgClient.send('get_organisations_by_ids', {
            organizationIds: cpOrganizationIds,
          }),
        )
      : [];
    const cpOrganizationsById = new Map(
      cpOrganizations.map((organization) => [organization.id, organization]),
    );
    const assignmentsByProjectId = new Map<string, ProjectCpAssignment[]>();

    for (const assignment of assignments) {
      const projectAssignments =
        assignmentsByProjectId.get(assignment.projectId) ?? [];

      projectAssignments.push(assignment);
      assignmentsByProjectId.set(assignment.projectId, projectAssignments);
    }

    return projects.map((project) => {
      const projectAssignments = assignmentsByProjectId.get(project.id) ?? [];

      return {
        ...project,
        assignedCpOrganizationIds: projectAssignments.map(
          (assignment) => assignment.cpOrganizationId,
        ),
        cpAssignments: projectAssignments.map((assignment) => ({
          ...assignment,
          cpOrganisationName:
            cpOrganizationsById.get(assignment.cpOrganizationId)?.name ?? null,
          cpOrganizationName:
            cpOrganizationsById.get(assignment.cpOrganizationId)?.name ?? null,
        })),
      };
    });
  }

  private validateProjectRequest(dto: GetProjectDto) {
    if (!dto.projectId || !dto.userId) {
      throw new RpcException('Project ID and user ID are required');
    }
  }

  private hasAnyProjectDetailsUpdate(projectDetails: ProjectDetailsUpdate) {
    return [
      projectDetails.name,
      projectDetails.location,
      projectDetails.reraNumber,
      projectDetails.priceRange,
      projectDetails.description,
    ].some((value) => value !== undefined);
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
