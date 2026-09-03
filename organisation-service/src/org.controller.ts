import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrgService } from './org.service';

@Controller()
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @MessagePattern('create_developer_organisation')
  registerDeveloperOrganisation(@Payload() dto: any) {
    return this.orgService.createDeveloperOrganisation(dto);
  }

  @MessagePattern('create_cp_organisation')
  createCpOrganisation(@Payload() dto: any) {
    return this.orgService.createCpOrganisation(dto);
  }

  @MessagePattern('assign_developer_to_organisation')
  assignDeveloperToOrganisation(@Payload() dto: any) {
    return this.orgService.assignDeveloperToOrganisation(dto);
  }

  @MessagePattern('assign_cp_to_organisation')
  assignCpToOrganisation(@Payload() dto: any) {
    return this.orgService.assignCpToOrganisation(dto);
  }

  @MessagePattern('get_all_organisations')
  getAllOrganisations(@Payload() dto: any) {
    return this.orgService.getAllOrganisations(dto);
  }

  @MessagePattern('get_my_organisations')
  getMyOrganisations(@Payload() dto: any) {
    return this.orgService.getMyOrganisations(dto);
  }

  @MessagePattern('get_admin_dashboard_summary')
  getAdminDashboardSummary(@Payload() dto: any) {
    return this.orgService.getAdminDashboardSummary(dto);
  }

  @MessagePattern('get_developer_dashboard_summary')
  getDeveloperDashboardSummary(@Payload() dto: any) {
    return this.orgService.getDeveloperDashboardSummary(dto);
  }

  @MessagePattern('get_organisation_by_id')
  getOrganisationById(@Payload() dto: any) {
    return this.orgService.getOrganisationById(dto);
  }

  @MessagePattern('get_organisations_by_ids')
  getOrganisationsByIds(@Payload() dto: any) {
    return this.orgService.getOrganisationsByIds(dto);
  }
}
