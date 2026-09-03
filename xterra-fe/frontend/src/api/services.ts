//eslint-ignore
import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    "Content-Type": "application/json",
  },
});

export const createDeveloperOrganisation = async (payload: any) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.post(
    `${API_BASE_URL}/org/createDeveloper_organisation`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const createCpOrganisation = async (payload: any) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.post(
    `${API_BASE_URL}/org/createCp_organisation`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const getAllOrganisations = async () => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(`${API_BASE_URL}/org/getAllOrganisations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const assignDeveloperToOrganisation = async (
  organisationId: string,
  payload: any,
) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.post(
    `${API_BASE_URL}/org/${organisationId}/assignDeveloper`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const assignCpToOrganisation = async (
  organisationId: string,
  payload: any,
) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.post(
    `${API_BASE_URL}/org/${organisationId}/assignCp`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const createProject = async (payload: any) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.post(
    `${API_BASE_URL}/project/createProject`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const getMyOrganisations = async () => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(`${API_BASE_URL}/org/getMyOrganisations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getAllProjects = async (organisationId: string) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(`${API_BASE_URL}/project/getAllProjects`, {
    params: {
      organizationId: organisationId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateProject = async (projectId: string, payload: any) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.patch(
    `${API_BASE_URL}/project/${projectId}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const deleteProject = async (projectId: string) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.delete(`${API_BASE_URL}/project/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getProjectById = async (projectId: string) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(`${API_BASE_URL}/project/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getAdminDashboard = async () => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(`${API_BASE_URL}/org/adminDashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getDeveloperDashboard = async () => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(`${API_BASE_URL}/org/developerDashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getContextDashboard = async (organizationId) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(`${API_BASE_URL}/org/contextDashboard`, {
    params: {
      organizationId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getCpAssignedProjects = async (cpOrganizationId) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(
    `${API_BASE_URL}/project/getCpAssignedProjects`,
    {
      params: {
        cpOrganizationId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

export const getCpDashboard = async (cpOrganizationId) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.get(`${API_BASE_URL}/org/cpDashboard`, {
    params: {
      cpOrganizationId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const assignCpOrganisationToProject = async (
  projectId,
  cpOrganizationId,
) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.post(
    `${API_BASE_URL}/project/${projectId}/assignCpOrganisation`,
    {
      cpOrganizationId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const reAssignCpOrganisationToProject = async (
  projectId,
  newCpOrganizationId,
) => {
  const token = localStorage.getItem("accessToken");

  const response = await axios.patch(
    `${API_BASE_URL}/project/${projectId}/assignCpOrganisation`,
    {
      newCpOrganizationId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const getAgents = async () => {
  const response = await axios.get(`${API_BASE_URL}/agents`, authConfig());
  return response.data;
};

export const getAgentById = async (agentId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/agents/${agentId}`,
    authConfig(),
  );
  return response.data;
};

export const getAgentEvents = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/agents/events`,
    authConfig(),
  );
  return response.data;
};

export const getAgentTools = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/agents/tools`,
    authConfig(),
  );
  return response.data;
};

export const getToolsForAgentEvent = async (eventKey: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/agents/events/${eventKey}/tools`,
    authConfig(),
  );
  return response.data;
};

export const registerAgent = async (payload: any) => {
  const response = await axios.post(
    `${API_BASE_URL}/agents/register`,
    payload,
    authConfig(),
  );
  return response.data;
};

export const updateAgentStatus = async (
  agentId: string,
  status: "ACTIVE" | "DISABLED",
) => {
  const response = await axios.patch(
    `${API_BASE_URL}/agents/${agentId}/status`,
    { status },
    authConfig(),
  );
  return response.data;
};

export const runAgent = async (
  agentId: string,
  payload: { input?: string; payload?: Record<string, unknown> },
) => {
  const response = await axios.post(
    `${API_BASE_URL}/agents/${agentId}/execute`,
    payload,
    authConfig(),
  );
  return response.data;
};

export const getAgentExecutions = async (agentId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/agents/${agentId}/executions`,
    authConfig(),
  );
  return response.data;
};
