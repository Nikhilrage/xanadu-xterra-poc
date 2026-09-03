import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

const API_URL = "http://localhost:3000";

interface Project {
  id: string;
  name: string;
  location: string;
}

interface EditProjectModalProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onUpdated: (project: Project) => void;
}

interface UpdateProjectResponse {
  message?: string;
  project?: Project;
}

export default function EditProjectModal({
  open,
  project,
  onClose,
  onUpdated,
}: EditProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setProjectName(project?.name ?? "");
    setLocation(project?.location ?? "");
    setError("");
  }, [project]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/project/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_details: {
            name: projectName,
            location,
          },
        }),
      });
      const data = (await response.json()) as UpdateProjectResponse;

      if (!response.ok || !data.project) {
        throw new Error(data.message ?? "Unable to update project");
      }

      onUpdated(data.project);
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the API",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Project</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            fullWidth
            required
            label="Project Name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            required
            label="Location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
