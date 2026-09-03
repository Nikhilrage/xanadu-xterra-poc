import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import AppModal from "../atoms/AppModal";
import CreateProject from "./CreateProject";
import {
  getAllProjects,
  getMyOrganisations,
  deleteProject,
} from "../api/services";
import { useNavigate } from "react-router-dom";
import EditProjectForm from "./EditProjectForm";
import AssignCpOrganisation from "./AssignCpOrganisation";

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [openCreateProjectModal, setOpenCreateProjectModal] = useState(false);

  const [organisationId, setOrganisationId] = useState("");

  const [projects, setProjects] = useState<any[]>([]);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [openAssignCpModal, setOpenAssignCpModal] = useState(false);
  const [selectedAssignProject, setSelectedAssignProject] = useState<any>(null);

  const handleAssignCp = (project: any) => {
    setSelectedAssignProject(project);
    setOpenAssignCpModal(true);
  };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setOpenEditModal(true);
  };

  const fetchProjects = async (orgId: string) => {
    try {
      const response = await getAllProjects(orgId);

      setProjects(response);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchOrganisation = async () => {
    try {
      const currentContext = JSON.parse(
        localStorage.getItem("current_context") || '{"type":"admin"}',
      );

      // Admin switched to developer context
      if (
        currentContext.type === "developer" &&
        currentContext.organisationId
      ) {
        setOrganisationId(currentContext.organisationId);

        await fetchProjects(currentContext.organisationId);

        return;
      }

      // Normal developer login
      const organisations = await getMyOrganisations();

      if (organisations?.length) {
        const orgId = organisations[0].id;

        setOrganisationId(orgId);

        await fetchProjects(orgId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrganisation();
  }, []);

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);

      await fetchProjects(organisationId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Box>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5">Published Projects</Typography>

          <Button
            variant="contained"
            onClick={() => setOpenCreateProjectModal(true)}
          >
            Create Project
          </Button>
        </Box>

        {/* Search */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: "1px solid #ddd",
            borderRadius: 2,
            mb: 2,
          }}
        >
          <TextField placeholder="Search Projects..." fullWidth size="small" />
        </Paper>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #ddd",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>

                <TableCell>Requested On</TableCell>

                <TableCell>Status</TableCell>
                <TableCell>CP Organisation</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {projects.map((project: any) => (
                // <TableRow key={project.id}>
                //   <TableCell>{project.name}</TableCell>

                //   <TableCell>Project Detail</TableCell>

                //   <TableCell>
                //     {project.createdAt
                //       ? new Date(project.createdAt).toLocaleDateString()
                //       : "-"}
                //   </TableCell>

                //   <TableCell>Published</TableCell>
                // </TableRow>
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>

                  <TableCell>
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>

                  <TableCell>Published</TableCell>
                  {/* <TableCell>
                    {project.assignedCpOrganizationIds?.length
                      ? project.assignedCpOrganizationIds[0]
                      : "-"}
                  </TableCell> */}
                  <TableCell>
                    {project.cpAssignments?.length
                      ? project.cpAssignments[0].cpOrganisationName
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          navigate(`/project-management/${project.id}`)
                        }
                      >
                        View
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEdit(project)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleDelete(project.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleAssignCp(project)}
                      >
                        {project.assignedCpOrganizationIds?.length
                          ? "Change CP"
                          : "Assign CP"}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No Projects Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <AppModal
        open={openCreateProjectModal}
        onClose={() => setOpenCreateProjectModal(false)}
        title="Create New Project"
      >
        <CreateProject
          onClose={() => setOpenCreateProjectModal(false)}
          onProjectCreated={() => fetchProjects(organisationId)}
        />
      </AppModal>
      <AppModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        title="Edit Project"
      >
        {selectedProject && (
          <EditProjectForm
            project={selectedProject}
            onClose={() => setOpenEditModal(false)}
            onSuccess={() => {
              setOpenEditModal(false);
              fetchProjects(organisationId);
            }}
          />
        )}
      </AppModal>
      <AppModal
        open={openAssignCpModal}
        onClose={() => setOpenAssignCpModal(false)}
        title="Assign CP Organisation"
      >
        {selectedAssignProject && (
          <AssignCpOrganisation
            project={selectedAssignProject}
            onClose={() => setOpenAssignCpModal(false)}
            onSuccess={() => {
              setOpenAssignCpModal(false);
              fetchProjects(organisationId);
            }}
            isReassignment={
              selectedAssignProject?.assignedCpOrganizationIds?.length > 0
            }
          />
        )}
      </AppModal>
    </>
  );
};

export default ProjectManagement;
