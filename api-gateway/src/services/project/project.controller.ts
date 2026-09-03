import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpException,
  InternalServerErrorException,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';

@Controller('project')
export class ProjectController {
  constructor(
    @Inject('PROJECT_SERVICE')
    private readonly projectService: ClientProxy,
  ) {}

  @Post('createProject')
  @UseGuards(JwtAuthGuard)
  createProject(@Body() dto: any, @Req() req: any) {
    return this.handleProjectRequest(
      this.projectService.send('create_project', {
        ...dto,
        creatorId: req.user.userId,
        creatorRole: req.user.role,
      }),
    );
  }

  @Post('createDummyLead')
  @UseGuards(JwtAuthGuard)
  createDummyLead(@Body() dto: any) {
    return this.handleProjectRequest(
      this.projectService.send('create_dummy_lead', dto),
    );
  }

  @Get('getAllProjects')
  @UseGuards(JwtAuthGuard)
  getAllProjects(
    @Query('organizationId') organizationId: string,
    @Req() req: any,
  ) {
    return this.handleProjectRequest(
      this.projectService.send('get_all_projects', {
        organizationId,
        userId: req.user.userId,
      }),
    );
  }

  @Get('getCpAssignedProjects')
  @UseGuards(JwtAuthGuard)
  getCpAssignedProjects(
    @Query('cpOrganizationId') cpOrganizationId: string,
    @Req() req: any,
  ) {
    return this.handleProjectRequest(
      this.projectService.send('get_cp_assigned_projects', {
        cpOrganizationId,
        userId: req.user.userId,
      }),
    );
  }

  @Post(':projectId/assignCpOrganisation')
  @UseGuards(JwtAuthGuard)
  assignCpOrganisationToProject(
    @Param('projectId') projectId: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    return this.handleProjectRequest(
      this.projectService.send('assign_cp_organisation_to_project', {
        ...dto,
        projectId,
        userId: req.user.userId,
      }),
    );
  }

  @Patch(':projectId/assignCpOrganisation')
  @UseGuards(JwtAuthGuard)
  updateCpOrganisationAssignment(
    @Param('projectId') projectId: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    return this.handleProjectRequest(
      this.projectService.send('update_cp_organisation_assignment', {
        ...dto,
        projectId,
        userId: req.user.userId,
      }),
    );
  }

  @Get(':projectId')
  @UseGuards(JwtAuthGuard)
  getProject(@Param('projectId') projectId: string, @Req() req: any) {
    return this.handleProjectRequest(
      this.projectService.send('get_project', {
        projectId,
        userId: req.user.userId,
      }),
    );
  }

  @Patch(':projectId')
  @UseGuards(JwtAuthGuard)
  updateProject(
    @Param('projectId') projectId: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    return this.handleProjectRequest(
      this.projectService.send('update_project', {
        ...dto,
        projectId,
        userId: req.user.userId,
      }),
    );
  }

  @Delete(':projectId')
  @UseGuards(JwtAuthGuard)
  deleteProject(@Param('projectId') projectId: string, @Req() req: any) {
    return this.handleProjectRequest(
      this.projectService.send('delete_project', {
        projectId,
        userId: req.user.userId,
      }),
    );
  }

  private handleProjectRequest(request$: any) {
    return request$.pipe(
      catchError((error: unknown) => {
        const message = this.getRpcErrorMessage(error);

        return throwError(() => this.toHttpException(message));
      }),
    );
  }

  private getRpcErrorMessage(error: unknown) {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      const maybeError = error as { message?: unknown; status?: unknown };

      if (typeof maybeError.message === 'string') {
        return maybeError.message;
      }
    }

    return 'Something went wrong';
  }

  private toHttpException(message: string): HttpException {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('do not have') ||
      lowerMessage.includes('access')
    ) {
      return new ForbiddenException(message);
    }

    if (lowerMessage.includes('not found')) {
      return new NotFoundException(message);
    }

    if (
      lowerMessage.includes('required') ||
      lowerMessage.includes('unsupported')
    ) {
      return new BadRequestException(message);
    }

    return new InternalServerErrorException(message);
  }
}
