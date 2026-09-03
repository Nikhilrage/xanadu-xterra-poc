import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { In, Repository } from 'typeorm';
import { OrganizationMember } from './database/org-member.entity';
import { Organization } from './database/org.entity';

interface RegisterUserResponse {
  message: string;
  user?: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

type OrganizationType = 'developer' | 'cp';
type MemberRole = 'developer_member' | 'cp_member';

@Injectable()
export class OrgService {
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,

    @Inject('AUTHORIZATION_SERVICE')
    private readonly authorizationClient: ClientProxy,

    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepository: Repository<OrganizationMember>,
  ) {}

  async createDeveloperOrganisation(dto: any) {
    const organizationName = this.getOrganizationName(dto);

    if (!organizationName) {
      throw new RpcException('Organisation name is required');
    }

    if (!dto.adminId) {
      throw new RpcException('Admin ID is required');
    }

    let organization: Organization | undefined;
    let authorizationSyncAttempted = false;

    try {
      organization = await this.organizationRepository.save({
        name: organizationName,
        type: 'developer',
        adminId: dto.adminId,
      });

      authorizationSyncAttempted = true;
      await firstValueFrom(
        this.authorizationClient.send('sync_developer_organisation_admin', {
          organizationId: organization.id,
          adminId: dto.adminId,
        }),
      );

      return {
        message: 'Developer organisation created successfully',
        organization,
      };
    } catch (error) {
      const rollbackErrors: string[] = [];

      if (authorizationSyncAttempted && organization) {
        try {
          await firstValueFrom(
            this.authorizationClient.send(
              'remove_developer_organisation_admin',
              {
                organizationId: organization.id,
                adminId: dto.adminId,
              },
            ),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      if (organization) {
        try {
          await this.organizationRepository.delete(organization.id);
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      throw new RpcException(
        `${this.getErrorMessage(error)}${this.getRollbackMessage(rollbackErrors)}`,
      );
    }
  }

  async createCpOrganisation(dto: any) {
    const organizationName = this.getOrganizationName(dto);

    if (!organizationName) {
      throw new RpcException('Organisation name is required');
    }

    if (!dto.adminId) {
      throw new RpcException('Admin ID is required');
    }

    const organization = await this.organizationRepository.save({
      name: organizationName,
      type: 'cp',
      adminId: dto.adminId,
    });

    return {
      message: 'CP organisation created successfully',
      organization,
    };
  }

  async assignDeveloperToOrganisation(dto: any) {
    return this.assignMember(dto, {
      organizationType: 'developer',
      memberRole: 'developer_member',
      details:
        dto.developer_details ??
        dto.developer_Details ??
        dto.developerDetails,
      syncPattern: 'sync_developer_organisation_member',
      removePattern: 'remove_developer_organisation_member',
      memberIdKey: 'developerId',
    });
  }

  async assignCpToOrganisation(dto: any) {
    return this.assignMember(dto, {
      organizationType: 'cp',
      memberRole: 'cp_member',
      details: dto.cp_details ?? dto.cp_Details ?? dto.cpDetails,
      syncPattern: 'sync_cp_organisation_member',
      removePattern: 'remove_cp_organisation_member',
      memberIdKey: 'cpUserId',
    });
  }

  async getAllOrganisations(dto: any) {
    if (!dto.adminId) {
      throw new RpcException('Admin ID is required');
    }

    const developerOrganizations = await this.organizationRepository.find({
      where: {
        adminId: dto.adminId,
        type: 'developer',
      },
    });
    const cpOrganizations = await this.organizationRepository.find({
      where: {
        adminId: dto.adminId,
        type: 'cp',
      },
    });
    const organizations = [...developerOrganizations, ...cpOrganizations];

    const members = organizations.length
      ? await this.organizationMemberRepository.find({
          where: {
            organizationId: In(
              organizations.map((organization) => organization.id),
            ),
          },
        })
      : [];

    const developerIdsByOrganization = new Map<string, string[]>();
    const cpIdsByOrganization = new Map<string, string[]>();

    for (const organization of organizations) {
      developerIdsByOrganization.set(
        organization.id,
        organization.developerId ? [organization.developerId] : [],
      );
      cpIdsByOrganization.set(organization.id, []);
    }

    for (const member of members) {
      const idsByOrganization =
        member.role === 'cp_member'
          ? cpIdsByOrganization
          : developerIdsByOrganization;
      const memberIds = idsByOrganization.get(member.organizationId) ?? [];

      if (!memberIds.includes(member.userId)) {
        memberIds.push(member.userId);
      }

      idsByOrganization.set(member.organizationId, memberIds);
    }

    const userIds = [
      ...new Set([
        ...developerIdsByOrganization.values(),
        ...cpIdsByOrganization.values(),
      ].flat()),
    ];
    const users = await firstValueFrom<UserProfile[]>(
      this.authClient.send('get_user_profiles', {
        userIds,
      }),
    );
    const usersById = new Map(users.map((user) => [user.id, user]));

    return organizations.map((organization) => {
      const organizationDevelopers = (
        developerIdsByOrganization.get(organization.id) ?? []
      )
        .map((developerId) => usersById.get(developerId))
        .filter((developer): developer is UserProfile => Boolean(developer));
      const organizationCpMembers = (cpIdsByOrganization.get(organization.id) ?? [])
        .map((cpId) => usersById.get(cpId))
        .filter((cpMember): cpMember is UserProfile => Boolean(cpMember));

      return {
        id: organization.id,
        name: organization.name,
        type: organization.type,
        developer: organizationDevelopers[0] ?? null,
        developers: organizationDevelopers,
        cp: organizationCpMembers[0] ?? null,
        cps: organizationCpMembers,
      };
    });
  }

  async getMyOrganisations(dto: any) {
    if (!dto.userId || !dto.role) {
      throw new RpcException('User ID and role are required');
    }

    if (dto.role === 'developer_admin') {
      return this.organizationRepository.find({
        where: {
          adminId: dto.userId,
          type: 'developer',
        },
        order: {
          createdAt: 'DESC',
        },
      });
    }

    if (dto.role === 'developer_member' || dto.role === 'cp_member') {
      const memberships = await this.organizationMemberRepository.find({
        where: {
          userId: dto.userId,
          role: dto.role,
        },
      });

      const organizationType = dto.role === 'cp_member' ? 'cp' : 'developer';
      const organizationIds = memberships.map(
        (membership) => membership.organizationId,
      );

      if (dto.role === 'developer_member') {
        const legacyOrganizations = await this.organizationRepository.find({
          where: {
            developerId: dto.userId,
            type: 'developer',
          },
          order: {
            createdAt: 'DESC',
          },
        });

        for (const organization of legacyOrganizations) {
          if (!organizationIds.includes(organization.id)) {
            organizationIds.push(organization.id);
          }
        }
      }

      if (!organizationIds.length) {
        return [];
      }

      return this.organizationRepository.find({
        where: {
          id: In(organizationIds),
          type: organizationType,
        },
        order: {
          createdAt: 'DESC',
        },
      });
    }

    return [];
  }

  async getAdminDashboardSummary(dto: any) {
    if (!dto.adminId) {
      throw new RpcException('Admin ID is required');
    }

    const organizations = await this.organizationRepository.find({
      where: {
        adminId: dto.adminId,
      },
    });
    const organizationIds = organizations.map((organization) => organization.id);
    const developerOrganisationCount = organizations.filter(
      (organization) => organization.type === 'developer',
    ).length;
    const cpOrganisationCount = organizations.filter(
      (organization) => organization.type === 'cp',
    ).length;

    const members = organizationIds.length
      ? await this.organizationMemberRepository.find({
          where: {
            organizationId: In(organizationIds),
          },
        })
      : [];

    const developerMemberCount = members.filter(
      (member) => member.role === 'developer_member',
    ).length;
    const cpMemberCount = members.filter(
      (member) => member.role === 'cp_member',
    ).length;

    return {
      organizationIds,
      developerOrganizationIds: organizations
        .filter((organization) => organization.type === 'developer')
        .map((organization) => organization.id),
      organisationCount: organizations.length,
      developerOrganisationCount,
      cpOrganisationCount,
      peopleCount: members.length,
      developerMemberCount,
      cpMemberCount,
    };
  }

  async getDeveloperDashboardSummary(dto: any) {
    if (!dto.userId) {
      throw new RpcException('User ID is required');
    }

    const memberships = await this.organizationMemberRepository.find({
      where: {
        userId: dto.userId,
        role: 'developer_member',
      },
    });
    const organizationIds = memberships.map(
      (membership) => membership.organizationId,
    );

    const legacyOrganizations = await this.organizationRepository.find({
      where: {
        developerId: dto.userId,
        type: 'developer',
      },
    });

    for (const organization of legacyOrganizations) {
      if (!organizationIds.includes(organization.id)) {
        organizationIds.push(organization.id);
      }
    }

    return {
      organizationIds,
      organisationCount: organizationIds.length,
    };
  }

  async getOrganisationById(dto: any) {
    if (!dto.organizationId) {
      throw new RpcException('Organization ID is required');
    }

    const organization = await this.organizationRepository.findOne({
      where: {
        id: dto.organizationId,
      },
    });

    if (!organization) {
      throw new RpcException('Organisation not found');
    }

    return organization;
  }

  async getOrganisationsByIds(dto: any) {
    if (!dto.organizationIds?.length) {
      return [];
    }

    return this.organizationRepository.find({
      where: {
        id: In(dto.organizationIds),
      },
    });
  }

  private async assignMember(
    dto: any,
    options: {
      organizationType: OrganizationType;
      memberRole: MemberRole;
      details?: {
        name?: string;
        email?: string;
      };
      syncPattern: string;
      removePattern: string;
      memberIdKey: 'developerId' | 'cpUserId';
    },
  ) {
    if (!dto.organizationId) {
      throw new RpcException('Organization ID is required');
    }

    if (!options.details?.name || !options.details.email) {
      throw new RpcException('Member name and email are required');
    }

    const organization = await this.findOrganizationOrThrow(
      dto.organizationId,
      options.organizationType,
    );

    if (
      options.organizationType === 'developer' &&
      (!dto.adminId || organization.adminId !== dto.adminId)
    ) {
      throw new RpcException(
        'Only the associated developer admin can assign developers',
      );
    }

    let registeredUserId: string | undefined;
    let membership: OrganizationMember | undefined;
    let authorizationSyncAttempted = false;

    try {
      const registration = await firstValueFrom<RegisterUserResponse>(
        this.authClient.send('register', {
          name: options.details.name,
          email: options.details.email,
          role: options.memberRole,
          password: '1234',
        }),
      );

      if (!registration.user) {
        throw new RpcException(registration.message);
      }

      registeredUserId = registration.user.id;
      membership = await this.organizationMemberRepository.save({
        organizationId: organization.id,
        userId: registeredUserId,
        role: options.memberRole,
      });

      authorizationSyncAttempted = true;
      await firstValueFrom(
        this.authorizationClient.send(options.syncPattern, {
          organizationId: organization.id,
          [options.memberIdKey]: registeredUserId,
        }),
      );

      return {
        message: 'Member assigned to organisation successfully',
        organization,
        membership,
        member: registration.user,
      };
    } catch (error) {
      const rollbackErrors: string[] = [];

      if (authorizationSyncAttempted && registeredUserId) {
        try {
          await firstValueFrom(
            this.authorizationClient.send(options.removePattern, {
              organizationId: organization.id,
              [options.memberIdKey]: registeredUserId,
            }),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      if (membership) {
        try {
          await this.organizationMemberRepository.delete(membership.id);
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      if (registeredUserId) {
        try {
          await firstValueFrom(
            this.authClient.send('remove_registered_user', {
              userId: registeredUserId,
            }),
          );
        } catch (rollbackError) {
          rollbackErrors.push(this.getErrorMessage(rollbackError));
        }
      }

      throw new RpcException(
        `${this.getErrorMessage(error)}${this.getRollbackMessage(rollbackErrors)}`,
      );
    }
  }

  private async findOrganizationOrThrow(
    organizationId: string,
    type: OrganizationType,
  ) {
    const organization = await this.organizationRepository.findOne({
      where: {
        id: organizationId,
        type,
      },
    });

    if (!organization) {
      throw new RpcException(`${type.toUpperCase()} organisation not found`);
    }

    return organization;
  }

  private getOrganizationName(dto: any) {
    return (
      dto.organisation_details?.name ??
      dto.orgainsation_details?.name ??
      dto.organization_details?.name ??
      dto.name
    );
  }

  private getRollbackMessage(rollbackErrors: string[]) {
    return rollbackErrors.length > 0
      ? ` Rollback errors: ${rollbackErrors.join('; ')}`
      : '';
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
