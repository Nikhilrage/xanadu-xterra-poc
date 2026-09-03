import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthorizationService } from './authorization.service';

@Controller()
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @MessagePattern('sync_developer_organisation')
  syncDeveloperOrganisation(@Payload() dto: any) {
    return this.authorizationService.syncDeveloperOrganisation(dto);
  }

  @MessagePattern('sync_developer_organisation_admin')
  syncDeveloperOrganisationAdmin(@Payload() dto: any) {
    return this.authorizationService.syncDeveloperOrganisationAdmin(dto);
  }

  @MessagePattern('remove_developer_organisation_admin')
  removeDeveloperOrganisationAdmin(@Payload() dto: any) {
    return this.authorizationService.removeDeveloperOrganisationAdmin(dto);
  }

  @MessagePattern('sync_developer_organisation_member')
  syncDeveloperOrganisationMember(@Payload() dto: any) {
    return this.authorizationService.syncDeveloperOrganisationMember(dto);
  }

  @MessagePattern('remove_developer_organisation_member')
  removeDeveloperOrganisationMember(@Payload() dto: any) {
    return this.authorizationService.removeDeveloperOrganisationMember(dto);
  }

  @MessagePattern('sync_cp_organisation_member')
  syncCpOrganisationMember(@Payload() dto: any) {
    return this.authorizationService.syncCpOrganisationMember(dto);
  }

  @MessagePattern('remove_cp_organisation_member')
  removeCpOrganisationMember(@Payload() dto: any) {
    return this.authorizationService.removeCpOrganisationMember(dto);
  }

  @MessagePattern('check_cp_organisation_access')
  checkCpOrganisationAccess(@Payload() dto: any) {
    return this.authorizationService.checkCpOrganisationAccess(dto);
  }

  @MessagePattern('remove_developer_organisation')
  removeDeveloperOrganisation(@Payload() dto: any) {
    return this.authorizationService.removeDeveloperOrganisation(dto);
  }

  @MessagePattern('check_developer_organisation_access')
  checkDeveloperOrganisationAccess(@Payload() dto: any) {
    return this.authorizationService.checkDeveloperOrganisationAccess(dto);
  }

  @MessagePattern('sync_project_owner')
  syncProjectOwner(@Payload() dto: any) {
    return this.authorizationService.syncProjectOwner(dto);
  }

  @MessagePattern('remove_project_owner')
  removeProjectOwner(@Payload() dto: any) {
    return this.authorizationService.removeProjectOwner(dto);
  }

  @MessagePattern('sync_project_cp_assignment')
  syncProjectCpAssignment(@Payload() dto: any) {
    return this.authorizationService.syncProjectCpAssignment(dto);
  }

  @MessagePattern('remove_project_cp_assignment')
  removeProjectCpAssignment(@Payload() dto: any) {
    return this.authorizationService.removeProjectCpAssignment(dto);
  }

  @MessagePattern('check_project_permission')
  checkProjectPermission(@Payload() dto: any) {
    return this.authorizationService.checkProjectPermission(dto);
  }

  @MessagePattern('sync_agent_tool_permissions')
  syncAgentToolPermissions(@Payload() dto: any) {
    return this.authorizationService.syncAgentToolPermissions(dto);
  }

  @MessagePattern('check_agent_tool_access')
  checkAgentToolAccess(@Payload() dto: any) {
    return this.authorizationService.checkAgentToolAccess(dto);
  }
}
