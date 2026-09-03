import { useState, type FormEvent } from "react";
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

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

interface CreateProjectResponse {
  message?: string;
}

export default function CreateProjectModal({
  open,
  onClose,
  organizationId,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function closeModal() {
    setMessage("");
    setError("");
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/project/createProject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          project_details: {
            name: projectName,
            location,
          },
        }),
      });
      const data = (await response.json()) as CreateProjectResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to create project");
      }

      setMessage(data.message ?? "Project created successfully");
      setProjectName("");
      setLocation("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the API",
      );
    } finally {
      closeModal()
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={closeModal} fullWidth maxWidth="sm">
      <DialogTitle>Create Project</DialogTitle>
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

          {message && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeModal}>Close</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
