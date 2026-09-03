import { Box, Card, CardContent, Grid, Paper, Typography } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import BusinessIcon from "@mui/icons-material/Business";
import GroupsIcon from "@mui/icons-material/Groups";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CampaignIcon from "@mui/icons-material/Campaign";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PersonIcon from "@mui/icons-material/Person";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getAdminDashboard,
  getContextDashboard,
  getDeveloperDashboard,
  getCpDashboard,
  getMyOrganisations,
} from "../api/services";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const context = useSelector((state: any) => state.context.currentContext);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        let response;

        // CP MEMBER
        if (user?.role === "cp_member") {
          const organisations = await getMyOrganisations();

          if (organisations?.length) {
            response = await getCpDashboard(organisations[0].id);
          }
        }

        // DEVELOPER MEMBER
        else if (user?.role === "developer_member") {
          response = await getDeveloperDashboard();
        }

        // ADMIN SWITCHED TO DEVELOPER CONTEXT
        else if (context?.type === "developer") {
          response = await getContextDashboard(context.organisationId);
        }

        // ADMIN
        else {
          response = await getAdminDashboard();
        }

        setDashboardData(response);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [context]);

  if (loading) {
    return <Typography>Loading Dashboard...</Typography>;
  }

  if (!dashboardData) {
    return null;
  }

  let cards: any[] = [];

  // CP MEMBER
  if (user?.role === "cp_member") {
    cards = [
      {
        title: "Assigned Projects",
        value: dashboardData.assignedProjectCount || 0,
        icon: <FolderOpenIcon />,
      },
      {
        title: "Active Leads",
        value: dashboardData.stats?.activeLeads || 0,
        icon: <GroupsIcon />,
      },
      {
        title: "Site Visits",
        value: dashboardData.stats?.siteVisitsScheduled || 0,
        icon: <ApartmentIcon />,
      },
      {
        title: "Conversion Rate",
        value: dashboardData.stats?.conversionRate || "0%",
        icon: <TrendingUpIcon />,
      },
    ];
  }

  // DEVELOPER MEMBER OR ADMIN CONTEXT SWITCH
  else if (user?.role === "developer_member" || context?.type === "developer") {
    cards = [
      {
        title: "Projects",
        value: dashboardData.projectCount || 0,
        icon: <FolderOpenIcon />,
      },
      {
        title: "Leads",
        value: 124,
        icon: <GroupsIcon />,
      },
      {
        title: "Site Visits",
        value: 58,
        icon: <ApartmentIcon />,
      },
      {
        title: "Bookings",
        value: 12,
        icon: <BusinessIcon />,
      },
      {
        title: "Revenue",
        value: "₹2.4Cr",
        icon: <TrendingUpIcon />,
      },
      {
        title: "Active Campaigns",
        value: 8,
        icon: <CampaignIcon />,
      },
    ];
  }

  // ADMIN
  else {
    cards = [
      {
        title: "Total Organisations",
        value: dashboardData.organisationCount || 0,
        icon: <BusinessIcon />,
      },
      {
        title: "Developer Organisations",
        value: dashboardData.developerOrganisationCount || 0,
        icon: <ApartmentIcon />,
      },
      {
        title: "CP Organisations",
        value: dashboardData.cpOrganisationCount || 0,
        icon: <GroupsIcon />,
      },
      {
        title: "People",
        value: dashboardData.peopleCount || 0,
        icon: <PersonIcon />,
      },
      {
        title: "Developer Members",
        value: dashboardData.developerMemberCount || 0,
        icon: <GroupsIcon />,
      },
      {
        title: "CP Members",
        value: dashboardData.cpMemberCount || 0,
        icon: <GroupsIcon />,
      },
      {
        title: "Projects",
        value: dashboardData.projectCount || 0,
        icon: <AccountTreeIcon />,
      },
    ];
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          p: 4,
          borderRadius: 4,
          background: "linear-gradient(135deg, #1976d2 10%, #42a5f5 100%)",
          color: "#fff",
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          Dashboard
        </Typography>

        <Typography sx={{ mt: 1, opacity: 0.9 }}>
          {user?.role === "cp_member"
            ? "Track leads and assigned projects."
            : user?.role === "developer_member" || context?.type === "developer"
              ? "Track projects and sales activity."
              : "Monitor organisations and platform growth."}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                transition: "all .25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                },
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>

                    <Typography variant="h4" fontWeight={700} mt={1}>
                      {card.value}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      background: "#eef6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1976d2",
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: "1px solid #e5e7eb",
              height: 260,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Quick Insights
            </Typography>

            {user?.role === "cp_member" ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Organisation
                </Typography>

                <Typography variant="h5" fontWeight={700} mb={3}>
                  {dashboardData.cpOrganisationName}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Active Users
                </Typography>

                <Typography variant="h5" fontWeight={700} mb={3}>
                  {dashboardData.peopleCount || 42}
                </Typography>
              </>
            )}

            <Typography variant="body2" color="text.secondary">
              Growth This Month
            </Typography>

            <Typography variant="h5" fontWeight={700} color="success.main">
              +18%
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
