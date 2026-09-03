import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import authorizationModel from '../../model.js';

interface Store {
  id: string;
  name: string;
}

interface AuthorizationModel {
  id: string;
  schema_version: string;
  type_definitions: unknown[];
}

interface TupleKey {
  user: string;
  relation: string;
  object: string;
}

const PROJECT_PERMISSIONS = ['can_view', 'can_edit', 'can_delete'] as const;

@Injectable()
export class AuthorizationService implements OnModuleInit {
  private readonly apiUrl: string;
  private readonly storeName: string;
  private storeId?: string;
  private authorizationModelId?: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl =
      this.configService.get<string>('OPENFGA_API_URL') ??
      'http://localhost:9000';
    this.storeName =
      this.configService.get<string>('OPENFGA_STORE_NAME') ?? 'xanadu-xterra';
  }

  async onModuleInit() {
    await this.initializeOpenFga();
  }

  async syncDeveloperOrganisation(dto: any) {
    this.validateDeveloperOrganisation(dto);

    try {
      await this.ensureInitialized();
      const tuples = this.getDeveloperOrganisationTuples(dto);

      const missingTuples: TupleKey[] = [];

      for (const tuple of tuples) {
        if (!(await this.checkTuple(tuple))) {
          missingTuples.push(tuple);
        }
      }

      if (missingTuples.length > 0) {
        await this.request(`/stores/${this.storeId}/write`, {
          method: 'POST',
          body: JSON.stringify({
            authorization_model_id: this.authorizationModelId,
            writes: {
              tuple_keys: missingTuples,
            },
          }),
        });
      }

      return {
        message: 'Developer organisation synced with OpenFGA',
      };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  async syncDeveloperOrganisationAdmin(dto: any) {
    if (!dto.organizationId || !dto.adminId) {
      throw new RpcException('Organization ID and admin ID are required');
    }

    return this.syncTuple(
      {
        user: `user:${dto.adminId}`,
        relation: 'admin',
        object: `developer_org:${dto.organizationId}`,
      },
      'Developer organisation admin synced with OpenFGA',
    );
  }

  async removeDeveloperOrganisationAdmin(dto: any) {
    if (!dto.organizationId || !dto.adminId) {
      throw new RpcException('Organization ID and admin ID are required');
    }

    return this.removeTuple(
      {
        user: `user:${dto.adminId}`,
        relation: 'admin',
        object: `developer_org:${dto.organizationId}`,
      },
      'Developer organisation admin removed from OpenFGA',
    );
  }

  async syncDeveloperOrganisationMember(dto: any) {
    if (!dto.organizationId || !dto.developerId) {
      throw new RpcException('Organization ID and developer ID are required');
    }

    return this.syncTuple(
      {
        user: `user:${dto.developerId}`,
        relation: 'member',
        object: `developer_org:${dto.organizationId}`,
      },
      'Developer organisation member synced with OpenFGA',
    );
  }

  async removeDeveloperOrganisationMember(dto: any) {
    if (!dto.organizationId || !dto.developerId) {
      throw new RpcException('Organization ID and developer ID are required');
    }

    return this.removeTuple(
      {
        user: `user:${dto.developerId}`,
        relation: 'member',
        object: `developer_org:${dto.organizationId}`,
      },
      'Developer organisation member removed from OpenFGA',
    );
  }

  async syncCpOrganisationMember(dto: any) {
    if (!dto.organizationId || !dto.cpUserId) {
      throw new RpcException('Organization ID and CP user ID are required');
    }

    return this.syncTuple(
      {
        user: `user:${dto.cpUserId}`,
        relation: 'member',
        object: `cp_org:${dto.organizationId}`,
      },
      'CP organisation member synced with OpenFGA',
    );
  }

  async removeCpOrganisationMember(dto: any) {
    if (!dto.organizationId || !dto.cpUserId) {
      throw new RpcException('Organization ID and CP user ID are required');
    }

    return this.removeTuple(
      {
        user: `user:${dto.cpUserId}`,
        relation: 'member',
        object: `cp_org:${dto.organizationId}`,
      },
      'CP organisation member removed from OpenFGA',
    );
  }

  async removeDeveloperOrganisation(dto: any) {
    this.validateDeveloperOrganisation(dto);

    try {
      await this.ensureInitialized();
      const tuples = this.getDeveloperOrganisationTuples(dto);
      const existingTuples: TupleKey[] = [];

      for (const tuple of tuples) {
        if (await this.checkTuple(tuple)) {
          existingTuples.push(tuple);
        }
      }

      if (existingTuples.length > 0) {
        await this.request(`/stores/${this.storeId}/write`, {
          method: 'POST',
          body: JSON.stringify({
            authorization_model_id: this.authorizationModelId,
            deletes: {
              tuple_keys: existingTuples,
            },
          }),
        });
      }

      return {
        message: 'Developer organisation removed from OpenFGA',
      };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  async checkDeveloperOrganisationAccess(dto: any) {
    if (!dto.userId || !dto.organizationId) {
      throw new RpcException('User ID and organization ID are required');
    }

    try {
      await this.ensureInitialized();

      const object = `developer_org:${dto.organizationId}`;
      const user = `user:${dto.userId}`;
      const isAdmin = await this.checkTuple({
        user,
        relation: 'admin',
        object,
      });
      const isMember = await this.checkTuple({
        user,
        relation: 'member',
        object,
      });

      return {
        allowed: isAdmin || isMember,
      };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  async checkCpOrganisationAccess(dto: any) {
    if (!dto.userId || !dto.cpOrganizationId) {
      throw new RpcException('User ID and CP organization ID are required');
    }

    try {
      await this.ensureInitialized();

      return {
        allowed: await this.checkTuple({
          user: `user:${dto.userId}`,
          relation: 'member',
          object: `cp_org:${dto.cpOrganizationId}`,
        }),
      };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  async syncProjectOwner(dto: any) {
    this.validateProjectOwner(dto);

    try {
      await this.ensureInitialized();
      const tuple = this.getProjectOwnerTuple(dto);

      if (!(await this.checkTuple(tuple))) {
        await this.request(`/stores/${this.storeId}/write`, {
          method: 'POST',
          body: JSON.stringify({
            authorization_model_id: this.authorizationModelId,
            writes: {
              tuple_keys: [tuple],
            },
          }),
        });
      }

      return {
        message: 'Project owner synced with OpenFGA',
      };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  async removeProjectOwner(dto: any) {
    this.validateProjectOwner(dto);

    try {
      await this.ensureInitialized();
      const tuple = this.getProjectOwnerTuple(dto);

      if (await this.checkTuple(tuple)) {
        await this.request(`/stores/${this.storeId}/write`, {
          method: 'POST',
          body: JSON.stringify({
            authorization_model_id: this.authorizationModelId,
            deletes: {
              tuple_keys: [tuple],
            },
          }),
        });
      }

      return {
        message: 'Project owner removed from OpenFGA',
      };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  async syncProjectCpAssignment(dto: any) {
    this.validateProjectCpAssignment(dto);

    return this.syncTuple(
      this.getProjectCpAssignmentTuple(dto),
      'Project CP assignment synced with OpenFGA',
    );
  }

  async removeProjectCpAssignment(dto: any) {
    this.validateProjectCpAssignment(dto);

    return this.removeTuple(
      this.getProjectCpAssignmentTuple(dto),
      'Project CP assignment removed from OpenFGA',
    );
  }

  async checkProjectPermission(dto: any) {
    if (!dto.userId || !dto.projectId || !dto.permission) {
      throw new RpcException(
        'User ID, project ID, and permission are required',
      );
    }

    if (!PROJECT_PERMISSIONS.includes(dto.permission)) {
      throw new RpcException('Unsupported project permission');
    }

    try {
      await this.ensureInitialized();

      return {
        allowed: await this.checkTuple({
          user: `user:${dto.userId}`,
          relation: dto.permission,
          object: `project:${dto.projectId}`,
        }),
      };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  async syncAgentToolPermissions(dto: any) {
    if (!dto.agentId || !Array.isArray(dto.toolKeys) || !dto.toolKeys.length) {
      throw new RpcException('Agent ID and tool keys are required');
    }

    try {
      await this.ensureInitialized();
      const tuple_keys = dto.toolKeys.map((toolKey: string) => ({
        user: `agent:${dto.agentId}`,
        relation: 'executor',
        object: `tool:${toolKey}`,
      }));

      await this.request(`/stores/${this.storeId}/write`, {
        method: 'POST',
        body: JSON.stringify({
          authorization_model_id: this.authorizationModelId,
          writes: { tuple_keys },
        }),
      });

      return { message: 'Agent tool permissions synced with OpenFGA' };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  async checkAgentToolAccess(dto: any) {
    if (!dto.agentId || !dto.toolKey) {
      throw new RpcException('Agent ID and tool key are required');
    }

    try {
      await this.ensureInitialized();
      return {
        allowed: await this.checkTuple({
          user: `agent:${dto.agentId}`,
          relation: 'can_execute',
          object: `tool:${dto.toolKey}`,
        }),
      };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  private async ensureInitialized() {
    if (!this.storeId || !this.authorizationModelId) {
      await this.initializeOpenFga();
    }
  }

  private async syncTuple(tuple: TupleKey, message: string) {
    try {
      await this.ensureInitialized();

      if (!(await this.checkTuple(tuple))) {
        await this.request(`/stores/${this.storeId}/write`, {
          method: 'POST',
          body: JSON.stringify({
            authorization_model_id: this.authorizationModelId,
            writes: {
              tuple_keys: [tuple],
            },
          }),
        });
      }

      return { message };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  private async removeTuple(tuple: TupleKey, message: string) {
    try {
      await this.ensureInitialized();

      if (await this.checkTuple(tuple)) {
        await this.request(`/stores/${this.storeId}/write`, {
          method: 'POST',
          body: JSON.stringify({
            authorization_model_id: this.authorizationModelId,
            deletes: {
              tuple_keys: [tuple],
            },
          }),
        });
      }

      return { message };
    } catch (error) {
      throw new RpcException(this.getErrorMessage(error));
    }
  }

  private async initializeOpenFga() {
    const storesResponse = await this.request<{ stores?: Store[] }>('/stores');
    const existingStore = storesResponse.stores?.find(
      (store) => store.name === this.storeName,
    );

    if (existingStore) {
      this.storeId = existingStore.id;
    } else {
      const store = await this.request<Store>('/stores', {
        method: 'POST',
        body: JSON.stringify({
          name: this.storeName,
        }),
      });
      this.storeId = store.id;
    }

    const modelsResponse = await this.request<{
      authorization_models?: AuthorizationModel[];
    }>(`/stores/${this.storeId}/authorization-models`);

    const matchingModel = modelsResponse.authorization_models?.find(
      (model) =>
        model.schema_version === authorizationModel.schema_version &&
        JSON.stringify(model.type_definitions) ===
          JSON.stringify(authorizationModel.type_definitions),
    );

    if (matchingModel) {
      this.authorizationModelId = matchingModel.id;
      return;
    }

    const model = await this.request<{ authorization_model_id: string }>(
      `/stores/${this.storeId}/authorization-models`,
      {
        method: 'POST',
        body: JSON.stringify(authorizationModel),
      },
    );
    this.authorizationModelId = model.authorization_model_id;
  }

  private async checkTuple(tuple: TupleKey) {
    const response = await this.request<{ allowed: boolean }>(
      `/stores/${this.storeId}/check`,
      {
        method: 'POST',
        body: JSON.stringify({
          authorization_model_id: this.authorizationModelId,
          tuple_key: tuple,
        }),
      },
    );

    return response.allowed;
  }

  private validateDeveloperOrganisation(dto: any) {
    if (!dto.organizationId || !dto.adminId || !dto.developerId) {
      throw new RpcException(
        'Organization ID, admin ID, and developer ID are required',
      );
    }
  }

  private getDeveloperOrganisationTuples(dto: any): TupleKey[] {
    return [
      {
        user: `user:${dto.adminId}`,
        relation: 'admin',
        object: `developer_org:${dto.organizationId}`,
      },
      {
        user: `user:${dto.developerId}`,
        relation: 'member',
        object: `developer_org:${dto.organizationId}`,
      },
    ];
  }

  private validateProjectOwner(dto: any) {
    if (!dto.projectId || !dto.organizationId) {
      throw new RpcException('Project ID and organization ID are required');
    }
  }

  private validateProjectCpAssignment(dto: any) {
    if (!dto.projectId || !dto.cpOrganizationId) {
      throw new RpcException('Project ID and CP organization ID are required');
    }
  }

  private getProjectOwnerTuple(dto: any): TupleKey {
    return {
      user: `developer_org:${dto.organizationId}`,
      relation: 'owner_org',
      object: `project:${dto.projectId}`,
    };
  }

  private getProjectCpAssignmentTuple(dto: any): TupleKey {
    return {
      user: `cp_org:${dto.cpOrganizationId}`,
      relation: 'assigned_cp',
      object: `project:${dto.projectId}`,
    };
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `OpenFGA request failed (${response.status}): ${await response.text()}`,
      );
    }

    return (await response.json()) as T;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error
      ? `OpenFGA synchronization failed: ${error.message}`
      : 'OpenFGA synchronization failed';
  }
}
