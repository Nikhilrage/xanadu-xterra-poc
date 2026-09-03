import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { createProject, getMyOrganisations } from "../api/services";

const CreateProject = ({ onClose }: any) => {
  const [projectName, setProjectName] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [description, setDescription] = useState("");
  const [organisationId, setOrganisationId] = useState("");

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

        return;
      }

      // Normal developer login
      const response = await getMyOrganisations();

      if (response?.length) {
        setOrganisationId(response[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrganisation();
  }, []);

  const handleSubmit = async () => {
    try {
      await createProject({
        organizationId: organisationId,
        project_details: {
          name: projectName,
          location,
          reraNumber,
          priceRange: [priceRange],
          description,
        },
      });

      setProjectName("");
      setReraNumber("");
      setLocation("");
      setPriceRange("");
      setDescription("");

      onClose?.();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        New Project Details
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="RERA Number"
            value={reraNumber}
            onChange={(e) => setReraNumber(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Price Range"
            placeholder="50L-75L"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Description"
            multiline
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 1,
            }}
          >
            <Button variant="contained" onClick={handleSubmit}>
              Create Project
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateProject;
