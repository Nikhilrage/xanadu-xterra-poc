import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  FormControl,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from "@mui/material";
import DomainIcon from "@mui/icons-material/Domain";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllOrganisations } from "../api/services";
import { useDispatch } from "react-redux";
import { clearContext, setContext } from "../store/contextSlice";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Organisation = {
  id: string;
  name: string;
  type: string;
  developer?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const [organisations, setOrganisations] = useState<Organisation[]>([]);

  // const [selectedContext, setSelectedContext] = useState("admin");
  const [selectedContext, setSelectedContext] = useState(() => {
    const savedContext = localStorage.getItem("current_context");

    if (!savedContext) {
      return "admin";
    }

    const context = JSON.parse(savedContext);

    return context.type === "developer" ? context.organisationId : "admin";
  });

  const storedUser = localStorage.getItem("user");

  const user: User | null = storedUser ? JSON.parse(storedUser) : null;

  const isDeveloperAdmin = user?.role === "developer_admin";

  useEffect(() => {
    const loadOrganisations = async () => {
      try {
        const response = await getAllOrganisations();

        const developerOrgs = response.filter(
          (org: any) => org.type === "developer",
        );

        setOrganisations(developerOrgs);
      } catch (error) {
        console.error("Failed to load organisations", error);
      }
    };

    if (isDeveloperAdmin) {
      loadOrganisations();
    }
  }, [isDeveloperAdmin]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    dispatch(clearContext());
    navigate("/login");
  };

  const handleContextSwitch = (payload: any) => {
    dispatch(setContext(payload));

    navigate("/dashboard", {
      replace: true,
    });
  };
  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        bgcolor: "#ffffff",
        color: "#1a1c1c",
        borderBottom: "1px solid #c7c6ca",
        height: 64,
      }}
    >
      <Toolbar
        sx={{
          height: 64,
          px: { xs: 2, md: 5 },
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Left */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <DomainIcon />

          <Typography fontWeight={700} fontSize={20}>
            InXiteOut
          </Typography>
        </Box>

        {/* Context Switcher */}
        {isDeveloperAdmin && (
          <Box
            sx={{
              flex: 1,
              ml: 4,
            }}
          >
            <FormControl size="small">
              <Select
                value={selectedContext}
                onChange={(e) => {
                  const value = e.target.value;

                  setSelectedContext(value);

                  if (value === "admin") {
                    dispatch(
                      setContext({
                        type: "admin",
                        role: "developer_admin",
                        name: user?.name,
                        email: user?.email,
                        id: user?.id,
                      }),
                    );
                    navigate("/dashboard", {
                      replace: true,
                    });
                    return;
                  }

                  const org = organisations.find((item) => item.id === value);

                  if (!org) return;

                  dispatch(
                    setContext({
                      type: "developer",
                      organisationId: org.id,
                      organisationName: org.name,
                      developerId: org.developer?.id,
                      developerName: org.developer?.name,
                      role: org.developer?.role,
                    }),
                  );
                  navigate("/dashboard", {
                    replace: true,
                  });
                }}
                IconComponent={ExpandMoreIcon}
                sx={{
                  minWidth: 220,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: "#fff",
                }}
                renderValue={(value) => {
                  if (value === "admin") {
                    return (
                      <Box>
                        <Typography fontSize={14} fontWeight={600}>
                          {user?.name}
                        </Typography>

                        <Typography fontSize={12} color="text.secondary">
                          Admin
                        </Typography>
                      </Box>
                    );
                  }

                  const org = organisations.find((o) => o.id === value);

                  return (
                    <Box>
                      <Typography fontSize={14} fontWeight={600}>
                        {org?.developer?.name}
                      </Typography>

                      <Typography fontSize={12} color="text.secondary">
                        {org?.name}
                      </Typography>
                    </Box>
                  );
                }}
              >
                <MenuItem value="admin">
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600}>{user?.name}</Typography>

                      <Typography variant="caption" color="text.secondary">
                        {user?.email}
                      </Typography>
                    </Box>

                    <Chip
                      icon={<CheckCircleIcon />}
                      label="ADMIN"
                      color="success"
                      size="small"
                    />
                  </Box>
                </MenuItem>

                {organisations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    <Box
                      sx={{
                        width: "80%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography fontWeight={600}>
                          {org?.developer?.name}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {org?.name}
                        </Typography>
                      </Box>

                      <Chip label="DEVELOPER" color="primary" size="small" />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Right */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <IconButton
            sx={{
              border: "1px solid #c7c6ca",
              borderRadius: 1,
              width: 40,
              height: 40,
            }}
          >
            <Badge color="error" variant="dot">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setProfileAnchor(null);
                handleLogout();
              }}
            >
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
