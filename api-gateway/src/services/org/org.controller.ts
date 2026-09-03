import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';

@Controller('org')
export class OrgController {
  constructor(
    @Inject('ORG_SERVICE')
    private readonly orgService: ClientProxy,

    @Inject('PROJECT_SERVICE')
    private readonly projectService: ClientProxy,
  ) {}

  @Post('createDeveloper_organisation')
  @UseGuards(JwtAuthGuard)
  create_developer_organsation(@Body() dto: any, @Req() req: any) {
    if (req.user.role !== 'developer_admin') {
      throw new ForbiddenException(
        'Only developer admins can create developer organisations',
      );
    }

    return this.orgService.send('create_developer_organisation', {
      ...dto,
      adminId: req.user.userId,
    });
  }

  @Post('createCp_organisation')
  @UseGuards(JwtAuthGuard)
  createCpOrganisation(@Body() dto: any, @Req() req: any) {
    if (!this.canManageCpOrganisations(req.user.role)) {
      throw new ForbiddenException(
        'Only developer admins or CP admins can create CP organisations',
      );
    }

    return this.orgService.send('create_cp_organisation', {
      ...dto,
      adminId: req.user.userId,
    });
  }

  @Post(':organizationId/assignDeveloper')
  @UseGuards(JwtAuthGuard)
  assignDeveloper(
    @Param('organizationId') organizationId: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    if (req.user.role !== 'developer_admin') {
      throw new ForbiddenException(
        'Only developer admins can assign developers',
      );
    }

    return this.orgService.send('assign_developer_to_organisation', {
      ...dto,
      organizationId,
      adminId: req.user.userId,
    });
  }

  @Post(':organizationId/assignCp')
  @UseGuards(JwtAuthGuard)
  assignCp(
    @Param('organizationId') organizationId: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    if (!this.canManageCpOrganisations(req.user.role)) {
      throw new ForbiddenException(
        'Only developer admins or CP admins can assign CP members',
      );
    }

    return this.orgService.send('assign_cp_to_organisation', {
      ...dto,
      organizationId,
    });
  }

  @Get('getAllOrganisations')
  @UseGuards(JwtAuthGuard)
  getAllOrganisations(@Req() req: any) {
    if (req.user.role !== 'developer_admin') {
      throw new ForbiddenException('Only developer admins can access organisations');
    }

    return this.orgService.send('get_all_organisations', {
      adminId: req.user.userId,
    });
  }

  @Get('getMyOrganisations')
  @UseGuards(JwtAuthGuard)
  getMyOrganisations(@Req() req: any) {
    return this.orgService.send('get_my_organisations', {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Get('adminDashboard')
  @UseGuards(JwtAuthGuard)
  async getAdminDashboard(@Req() req: any) {
    if (req.user.role !== 'developer_admin') {
      throw new ForbiddenException('Only developer admins can access dashboard');
    }

    const summary = await firstValueFrom(
      this.orgService.send('get_admin_dashboard_summary', {
        adminId: req.user.userId,
      }),
    );
    const projects = await firstValueFrom(
      this.projectService.send('count_projects_by_organizations', {
        organizationIds: summary.developerOrganizationIds,
      }),
    );

    return {
      organisationCount: summary.organisationCount,
      developerOrganisationCount: summary.developerOrganisationCount,
      cpOrganisationCount: summary.cpOrganisationCount,
      peopleCount: summary.peopleCount,
      developerMemberCount: summary.developerMemberCount,
      cpMemberCount: summary.cpMemberCount,
      projectCount: projects.projectCount,
    };
  }

  @Get('developerDashboard')
  @UseGuards(JwtAuthGuard)
  async getDeveloperDashboard(@Req() req: any) {
    if (req.user.role !== 'developer_member') {
      throw new ForbiddenException(
        'Only developer members can access developer dashboard',
      );
    }

    const summary = await firstValueFrom(
      this.orgService.send('get_developer_dashboard_summary', {
        userId: req.user.userId,
      }),
    );
    const projects = await firstValueFrom(
      this.projectService.send('count_projects_by_organizations', {
        organizationIds: summary.organizationIds,
      }),
    );

    return {
      organisationCount: summary.organisationCount,
      projectCount: projects.projectCount,
    };
  }

  @Get('contextDashboard')
  @UseGuards(JwtAuthGuard)
  async getContextDashboard(
    @Query('organizationId') organizationId: string,
    @Req() req: any,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const projects = await firstValueFrom(
      this.projectService.send('get_all_projects', {
        organizationId,
        userId: req.user.userId,
      }),
    );

    return {
      organizationId,
      projectCount: projects.length,
    };
  }

  @Get('cpDashboard')
  @UseGuards(JwtAuthGuard)
  async getCpDashboard(
    @Query('cpOrganizationId') cpOrganizationId: string,
    @Req() req: any,
  ) {
    if (req.user.role !== 'cp_member') {
      throw new ForbiddenException('Only CP members can access CP dashboard');
    }

    if (!cpOrganizationId) {
      throw new ForbiddenException('CP organization ID is required');
    }

    const organization = await firstValueFrom(
      this.orgService.send('get_organisation_by_id', {
        organizationId: cpOrganizationId,
      }),
    );
    const projects = await firstValueFrom(
      this.projectService.send('get_cp_assigned_projects', {
        cpOrganizationId,
        userId: req.user.userId,
      }),
    );

    return {
      cpOrganizationId,
      cpOrganisationName: organization.name,
      assignedProjectCount: projects.length,
      assignedProjects: projects,
      stats: {
        activeLeads: 24,
        siteVisitsScheduled: 7,
        conversionRate: '18%',
      },
    };
  }

  private canManageCpOrganisations(role: string) {
    return role === 'developer_admin' || role === 'cp_admin';
  }
}
