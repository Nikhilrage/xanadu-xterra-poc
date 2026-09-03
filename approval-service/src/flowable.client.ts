import { Injectable } from "@nestjs/common";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface FlowableVariable {
  name: string;
  value: string | boolean | number | null;
  type?: string;
}

export interface FlowableTask {
  id: string;
  name: string;
  taskDefinitionKey: string;
  processInstanceId: string;
  createTime: string;
}

interface FlowableListResponse<T> {
  data: T[];
}

export interface FlowableProcessInstance {
  id: string;
  processDefinitionId: string;
  businessKey?: string;
  ended?: boolean;
}

@Injectable()
export class FlowableClient {
  private readonly baseUrl =
    process.env.FLOWABLE_REST_URL ??
    "http://localhost:8080/flowable-task/process-api";

  private readonly authHeader = `Basic ${Buffer.from(
    `${process.env.FLOWABLE_USER ?? "admin"}:${process.env.FLOWABLE_PASSWORD ?? "test"}`,
  ).toString("base64")}`;

  async deployProjectPublishingWorkflow() {
    const workflowPath = this.resolveWorkflowPath();
    const form = new FormData();
    const workflowXml = readFileSync(workflowPath, "utf8");

    form.append("deploymentName", "project-publishing-approval");
    form.append(
      "file",
      new Blob([workflowXml], { type: "application/xml" }),
      "project-publishing.bpmn20.xml",
    );

    return this.request("repository/deployments", {
      method: "POST",
      body: form,
    });
  }

  async startProcess(projectId: string, projectName: string) {
    return this.request<FlowableProcessInstance>("runtime/process-instances", {
      method: "POST",
      body: JSON.stringify({
        processDefinitionKey: "projectPublishingApproval",
        businessKey: projectId,
        variables: [
          { name: "projectId", value: projectId },
          { name: "projectName", value: projectName },
          { name: "projectStatus", value: "CREATED" },
        ],
      }),
    });
  }

  async getActiveTasks(processInstanceId: string) {
    const response = await this.request<FlowableListResponse<FlowableTask>>(
      "query/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          processInstanceId,
          sort: "createTime",
          order: "asc",
        }),
      },
    );

    return response.data;
  }

  async completeTask(taskId: string, variables: FlowableVariable[] = []) {
    return this.request(`runtime/tasks/${taskId}`, {
      method: "POST",
      body: JSON.stringify({
        action: "complete",
        variables,
      }),
    });
  }

  async getHistoricProcess(processInstanceId: string) {
    const response = await this.request<
      FlowableListResponse<FlowableProcessInstance>
    >("query/historic-process-instances", {
      method: "POST",
      body: JSON.stringify({
        processInstanceId,
        includeProcessVariables: true,
      }),
    });

    return response.data[0] ?? null;
  }

  private resolveWorkflowPath() {
    const candidates = [
      join(process.cwd(), "src/workflows/project-publishing.bpmn20.xml"),
      join(process.cwd(), "dist/workflows/project-publishing.bpmn20.xml"),
      join(__dirname, "workflows/project-publishing.bpmn20.xml"),
    ];

    const workflowPath = candidates.find((candidate) => existsSync(candidate));

    if (!workflowPath) {
      throw new Error(
        `Workflow file not found. Tried: ${candidates.join(", ")}`,
      );
    }

    return workflowPath;
  }

  private async request<T = unknown>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", this.authHeader);
    headers.set("Accept", "application/json");

    if (init.body && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${this.baseUrl}/${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Flowable ${response.status}: ${message}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();

    return (text ? JSON.parse(text) : undefined) as T;
  }
}
