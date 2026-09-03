import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import CreateProjectModal from "./CreateProjectModal";

const API_URL = "http://localhost:3000";

interface Project {
  id: string;
  name: string;
  location: string;
}

interface ProjectSectionProps {
  title: string;
}

export default function ProjectSection({ title }: ProjectSectionProps) {
  const activeOrganisation = useSelector(
    (state: RootState) => state.context.activeOrganisation,
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!activeOrganisation?.id) {
      setProjects([]);
      return;
    }

    async function loadProjects() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `${API_URL}/project/getAllProjects?organizationId=${activeOrganisation.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = (await response.json()) as Project[] | { message?: string };

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Unable to load projects",
          );
        }

        setProjects(data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to connect to the API",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
  }, [activeOrganisation?.id]);

  if (!activeOrganisation) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2">
          Select an organisation from the navbar to load projects.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Active context: {activeOrganisation.name}
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setIsCreateOpen(true)}>
          Create Project
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {loading && <CircularProgress size={24} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && projects.length === 0 && (
        <Typography variant="body2">No projects found.</Typography>
      )}

      {projects.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <CreateProjectModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        organizationId={activeOrganisation.id}
      />
    </Paper>
  );
}
