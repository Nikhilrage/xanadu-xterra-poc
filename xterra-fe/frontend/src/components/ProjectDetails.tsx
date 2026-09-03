import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VerifiedIcon from "@mui/icons-material/Verified";
import StraightenIcon from "@mui/icons-material/Straighten";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DownloadIcon from "@mui/icons-material/Download";
import PoolIcon from "@mui/icons-material/Pool";
import SecurityIcon from "@mui/icons-material/Security";
import DescriptionIcon from "@mui/icons-material/Description";
import ShareIcon from "@mui/icons-material/Share";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById } from "../api/services";
import { useDispatch } from "react-redux";
import { showToast } from "../store/toastSlice";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = JSON.parse(localStorage.getItem("user"))?.role;
  const [project, setProject] = useState<any>(null);

  const fetchProject = async () => {
    try {
      const response = await getProjectById(projectId!);
      console.log("respon", response.status);
      setProject(response);
    } catch (error) {
      if (error.status === 403) {
        dispatch(
          showToast({
            message: `Not permitted to view the project ${projectId}`,
            severity: "error",
          }),
        );
        navigate("/cp-projects");
        return;
      }
    }
  };

  useEffect(() => {
    fetchProject();
  }, []);

  if (!project) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h4" fontWeight={700}>
              {project.name}
            </Typography>

            <Chip
              label="UNDER CONSTRUCTION"
              size="small"
              sx={{
                bgcolor: "#f3f4f6",
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LocationOnIcon fontSize="small" />
            <Typography color="text.secondary">{project.location}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button startIcon={<ShareIcon />} variant="outlined">
            Share
          </Button>

          <Button startIcon={<FileDownloadIcon />} variant="outlined">
            Export
          </Button>

          {role != "cp_member" && (
            <Button startIcon={<EditIcon />} variant="contained">
              Edit Project
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Hero Image */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            sx={{
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <CardMedia
              component="img"
              height="450"
              image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000"
            />
          </Card>
        </Grid>

        {/* Right Side Stats */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Card>
                <CardContent>
                  <VerifiedIcon />
                  <Typography variant="body2" color="text.secondary">
                    RERA Number
                  </Typography>
                  <Typography fontWeight={700}>{project.reraNumber}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Card>
                <CardContent>
                  <StraightenIcon />
                  <Typography variant="body2" color="text.secondary">
                    Total Area
                  </Typography>
                  <Typography fontWeight={700}>50,000 sq.ft</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Card>
                <CardContent>
                  <CalendarMonthIcon />
                  <Typography variant="body2" color="text.secondary">
                    Possession
                  </Typography>
                  <Typography fontWeight={700}>Jan 2028</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Card>
                <CardContent>
                  <CurrencyRupeeIcon />
                  <Typography variant="body2" color="text.secondary">
                    Price Range
                  </Typography>
                  <Typography fontWeight={700}>
                    {Array.isArray(project.priceRange)
                      ? project.priceRange.join(", ")
                      : project.priceRange}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "#111827",
                  color: "white",
                  borderRadius: 3,
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  CURRENT PHASE
                </Typography>

                <Typography variant="h6" sx={{ my: 2 }}>
                  Foundation & Core Slab
                </Typography>

                <Box
                  sx={{
                    width: "100%",
                    height: 8,
                    bgcolor: "#374151",
                    borderRadius: 10,
                  }}
                >
                  <Box
                    sx={{
                      width: "34%",
                      height: "100%",
                      bgcolor: "white",
                      borderRadius: 10,
                    }}
                  />
                </Box>

                <Typography sx={{ mt: 1 }}>
                  34% of project milestones complete
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Overview */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Project Overview
            </Typography>

            <Typography sx={{ mb: 3 }}>{project.description}</Typography>

            <Typography
              sx={{
                borderLeft: "4px solid #ddd",
                pl: 2,
                fontStyle: "italic",
                color: "text.secondary",
              }}
            >
              Each unit is thoughtfully planned with spacious balconies,
              floor-to-ceiling windows for ample natural light, modular
              kitchens, and smart home provisions.
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid size={{ xs: 6 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <PoolIcon />
                  <Box>
                    <Typography fontWeight={600}>Leisure Amenities</Typography>
                    <Typography variant="body2">
                      Infinity pool, Zen garden, and clubhouse
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <SecurityIcon />
                  <Box>
                    <Typography fontWeight={600}>Premium Security</Typography>
                    <Typography variant="body2">
                      24/7 CCTV and gated access
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Compliance */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Compliance
            </Typography>

            {["RERA_Cert.pdf", "Impact_Report.pdf", "Structural_Plan.dwg"].map(
              (file) => (
                <Box
                  key={file}
                  sx={{
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <DescriptionIcon />
                    <Box>
                      <Typography>{file}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Uploaded recently
                      </Typography>
                    </Box>
                  </Box>

                  <DownloadIcon />
                </Box>
              ),
            )}
          </Paper>
        </Grid>

        {/* Team */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Management Team
            </Typography>

            <Grid container spacing={3}>
              {[
                {
                  name: "Jonathan Sterling",
                  role: "Lead Architect",
                },
                {
                  name: "Elena Vance",
                  role: "Structural Engineer",
                },
                {
                  name: "Marcus Thorne",
                  role: "Project Manager",
                },
              ].map((member) => (
                <Grid key={member.name}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Avatar>{member.name.charAt(0)}</Avatar>

                    <Box>
                      <Typography fontWeight={600}>{member.name}</Typography>

                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Activity */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Recent Activity
            </Typography>

            {[
              "Structural plans uploaded",
              "Compliance check passed",
              "RERA Certification added",
              "Project initiated",
            ].map((item) => (
              <Box
                key={item}
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    bgcolor: "black",
                    borderRadius: "50%",
                    mt: 1,
                  }}
                />

                <Box>
                  <Typography fontWeight={500}>{item}</Typography>

                  <Typography variant="body2" color="text.secondary">
                    Recently
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDetails;
