import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { FlowableClient, FlowableTask } from "./flowable.client";

export class CreateProjectApprovalDto {
  projectId?: string;
  projectName?: string;
  name?: string;
}

export class UpdateProjectChecksDto {
  reraNumber?: string;
  kycApproved?: boolean;
  superAdminApproved?: boolean;
}

export interface CompletedStep {
  taskId: string;
  taskName: string;
  decision: "APPROVED" | "REJECTED" | "COMPLETED";
  reason: string;
}

@Injectable()
export class ApprovalService implements OnModuleInit {
  private readonly logger = new Logger(ApprovalService.name);
  private workflowDeployed = false;

  constructor(private readonly flowableClient: FlowableClient) {}

  async onModuleInit() {
    try {
      await this.ensureWorkflowDeployed();
    } catch (error) {
      this.logger.warn(
        `Flowable workflow was not deployed on startup: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async createProjectApproval(dto: CreateProjectApprovalDto) {
    const projectName = dto.projectName ?? dto.name;

    if (!projectName) {
      throw new Error("projectName is required");
    }

    await this.ensureWorkflowDeployed();

    const projectId = dto.projectId ?? randomUUID();
    const processInstance = await this.flowableClient.startProcess(
      projectId,
      projectName,
    );

    const activeTasks = await this.flowableClient.getActiveTasks(
      processInstance.id,
    );

    return {
      projectId,
      projectName,
      processInstanceId: processInstance.id,
      status: "PENDING_COMPLIANCE",
      message: "Project created. RERA and KYC checks are waiting in parallel.",
      activeTasks: this.toTaskSummary(activeTasks),
    };
  }

  async updateProjectChecks(
    processInstanceId: string,
    dto: UpdateProjectChecksDto,
  ) {
    const completedSteps: CompletedStep[] = [];
    const ignoredUpdates: string[] = [];
    let latestDecision:
      | "REJECTED_BY_RERA"
      | "REJECTED_BY_KYC"
      | "REJECTED_BY_SUPER_ADMIN"
      | null = null;
    const startingTasks =
      await this.flowableClient.getActiveTasks(processInstanceId);

    if (!startingTasks.length) {
      return {
        processInstanceId,
        status: "PROCESS_ALREADY_ENDED",
        completedSteps,
        ignoredUpdates: ["No active Flowable tasks exist for this process."],
        activeTasks: [],
      };
    }

    if (dto.reraNumber !== undefined) {
      const reraTask = startingTasks.find(
        (task) => task.taskDefinitionKey === "reraCheckTask",
      );

      if (reraTask) {
        const reraApproved = this.isReraApproved(dto.reraNumber);
        await this.flowableClient.completeTask(reraTask.id, [
          { name: "reraNumber", value: dto.reraNumber },
          { name: "reraApproved", value: reraApproved },
          {
            name: "projectStatus",
            value: reraApproved ? "RERA_APPROVED" : "RERA_REJECTED",
          },
        ]);

        completedSteps.push({
          taskId: reraTask.id,
          taskName: reraTask.name,
          decision: reraApproved ? "APPROVED" : "REJECTED",
          reason: reraApproved
            ? "RERA number is present and has at least 6 characters."
            : "RERA number must have at least 6 characters for this POC.",
        });

        if (!reraApproved) {
          latestDecision = "REJECTED_BY_RERA";
        }
      } else {
        ignoredUpdates.push("RERA task is not active for this process.");
      }
    }

    if (!latestDecision && dto.kycApproved !== undefined) {
      const activeTasks =
        await this.flowableClient.getActiveTasks(processInstanceId);
      const kycTask = activeTasks.find(
        (task) => task.taskDefinitionKey === "kycCheckTask",
      );

      if (kycTask) {
        await this.flowableClient.completeTask(kycTask.id, [
          { name: "kycApproved", value: dto.kycApproved },
          {
            name: "projectStatus",
            value: dto.kycApproved ? "KYC_APPROVED" : "KYC_REJECTED",
          },
        ]);

        completedSteps.push({
          taskId: kycTask.id,
          taskName: kycTask.name,
          decision: dto.kycApproved ? "APPROVED" : "REJECTED",
          reason: dto.kycApproved
            ? "KYC was marked approved."
            : "KYC was marked rejected.",
        });

        if (!dto.kycApproved) {
          latestDecision = "REJECTED_BY_KYC";
        }
      } else {
        ignoredUpdates.push("KYC task is not active for this process.");
      }
    }

    let activeTasks =
      await this.flowableClient.getActiveTasks(processInstanceId);
    const adminTask = activeTasks.find(
      (task) => task.taskDefinitionKey === "adminPublishTask",
    );

    if (!latestDecision && adminTask) {
      await this.flowableClient.completeTask(adminTask.id, [
        { name: "adminApproved", value: true },
        { name: "projectStatus", value: "WAITING_FOR_SUPER_ADMIN" },
      ]);
      completedSteps.push({
        taskId: adminTask.id,
        taskName: adminTask.name,
        decision: "COMPLETED",
        reason: "Admin aproove is auto-completed. Waiting for super admin.",
      });
    }

    if (!latestDecision && dto.superAdminApproved !== undefined) {
      activeTasks = await this.flowableClient.getActiveTasks(processInstanceId);
      const superAdminTask = activeTasks.find(
        (task) => task.taskDefinitionKey === "superAdminPublishTask",
      );

      if (superAdminTask) {
        await this.flowableClient.completeTask(superAdminTask.id, [
          { name: "superAdminApproved", value: dto.superAdminApproved },
          {
            name: "projectStatus",
            value: dto.superAdminApproved
              ? "PUBLISHED"
              : "REJECTED_BY_SUPER_ADMIN",
          },
        ]);

        completedSteps.push({
          taskId: superAdminTask.id,
          taskName: superAdminTask.name,
          decision: dto.superAdminApproved ? "APPROVED" : "REJECTED",
          reason: dto.superAdminApproved
            ? "Super admin approved publishing."
            : "Super admin rejected publishing.",
        });

        if (!dto.superAdminApproved) {
          latestDecision = "REJECTED_BY_SUPER_ADMIN";
        }
      } else {
        ignoredUpdates.push(
          "Super admin task is not active. Complete RERA, KYC, and admin first.",
        );
      }
    }

    activeTasks = await this.flowableClient.getActiveTasks(processInstanceId);
    const superAdminPublished = completedSteps.some(
      (step) =>
        step.taskName === "Super admin publish" && step.decision === "APPROVED",
    );

    return {
      processInstanceId,
      status:
        latestDecision ??
        (superAdminPublished
          ? "PUBLISHED"
          : this.getStatusFromActiveTasks(activeTasks)),
      completedSteps,
      ignoredUpdates,
      activeTasks: this.toTaskSummary(activeTasks),
    };
  }

  async getProcessStatus(processInstanceId: string) {
    const [activeTasks, historicProcess] = await Promise.all([
      this.flowableClient.getActiveTasks(processInstanceId),
      this.flowableClient.getHistoricProcess(processInstanceId),
    ]);

    return {
      processInstanceId,
      ended: historicProcess?.ended ?? activeTasks.length === 0,
      activeTasks: this.toTaskSummary(activeTasks),
      historicProcess,
    };
  }

  private async ensureWorkflowDeployed() {
    if (this.workflowDeployed) {
      return;
    }

    await this.flowableClient.deployProjectPublishingWorkflow();
    this.workflowDeployed = true;
  }

  private isReraApproved(reraNumber: string) {
    return reraNumber.trim().length >= 6;
  }

  private getStatusFromActiveTasks(tasks: FlowableTask[]) {
    const hasReraTask = tasks.some(
      (task) => task.taskDefinitionKey === "reraCheckTask",
    );
    const hasKycTask = tasks.some(
      (task) => task.taskDefinitionKey === "kycCheckTask",
    );

    if (hasReraTask && hasKycTask) {
      return "PENDING_COMPLIANCE";
    }

    if (hasReraTask) {
      return "PENDING_RERA";
    }

    if (hasKycTask) {
      return "PENDING_KYC";
    }

    if (tasks.some((task) => task.taskDefinitionKey === "adminPublishTask")) {
      return "READY_FOR_ADMIN_PUBLISH";
    }

    if (
      tasks.some((task) => task.taskDefinitionKey === "superAdminPublishTask")
    ) {
      return "WAITING_FOR_SUPER_ADMIN";
    }

    return "NO_ACTIVE_TASKS";
  }

  private toTaskSummary(tasks: FlowableTask[]) {
    return tasks.map((task) => ({
      id: task.id,
      name: task.name,
      key: task.taskDefinitionKey,
      processInstanceId: task.processInstanceId,
    }));
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
