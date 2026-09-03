export const EVENT_REGISTRY_SEED = [
  {
    key: 'PROJECT_CREATED',
    name: 'Project Created',
    description: 'Triggered when a project is created in Xterra.',
    toolKeys: ['get_project_details', 'get_agent_projects', 'create_project'],
  },
  {
    key: 'LEAD_CREATED',
    name: 'Lead Created',
    description: 'Triggered when a lead is created in Xterra.',
    toolKeys: ['get_lead_details'],
  },
] as const;

export const TOOL_REGISTRY_SEED = [
  {
    key: 'create_project',
    name: 'Create Project',
    description: 'Creates a project in Xterra through Project Service.',
    category: 'PROJECT',
  },
  {
    key: 'get_agent_projects',
    name: 'Get Agent Projects',
    description: 'Lists only projects created by the authenticated agent.',
    category: 'PROJECT',
  },
  {
    key: 'get_project_details',
    name: 'Get Project Details',
    description: 'Retrieves project information from Xterra.',
    category: 'PROJECT',
  },
  {
    key: 'get_lead_details',
    name: 'Get Lead Details',
    description: 'Retrieves lead information from Xterra.',
    category: 'LEAD',
  },
] as const;
