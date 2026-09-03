import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getCpAssignedProjects, getMyOrganisations } from "../api/services";
import { useNavigate } from "react-router-dom";

const CpProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const organisations = await getMyOrganisations();

      if (!organisations?.length) {
        return;
      }

      const cpOrgId = organisations[0].id;

      const response = await getCpAssignedProjects(cpOrgId);

      setProjects(response || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Assigned Projects
        </Typography>

        <Chip label={`${projects.length} Projects`} color="primary" />
      </Box>

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

              <TableCell>Location</TableCell>

              <TableCell>RERA Number</TableCell>

              <TableCell>Price Range</TableCell>

              <TableCell>Description</TableCell>

              <TableCell>Created On</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Typography fontWeight={600}>{project.name}</Typography>
                </TableCell>

                <TableCell>{project.location}</TableCell>

                <TableCell>{project.reraNumber}</TableCell>

                <TableCell>{project.priceRange?.join(", ")}</TableCell>

                <TableCell>{project.description}</TableCell>

                <TableCell>
                  {new Date(project.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      navigate(`/project-management/${project.id}`)
                    }
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No Assigned Projects
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default CpProjects;
