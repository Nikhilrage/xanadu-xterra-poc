import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();

  const context = useSelector((state: any) => state.context.currentContext);

  const isDeveloperContext = context?.type === "developer";

  const isDeveloperAdmin = role === "developer_admin" && !isDeveloperContext;

  const isDeveloperMember = role === "developer_member" || isDeveloperContext;

  const isCP = role === "cp_member";

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        borderRight: "1px solid #ddd",
        height: "100vh",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2">Dashboard</Typography>
      </Box>

      <Divider />

      <List>
        {!isCP && (
          <ListItemButton onClick={() => navigate("/ai-agents")}>
            <SmartToyOutlinedIcon sx={{ mr: 1.5, fontSize: 20 }} />
            <ListItemText primary="AI Agents" />
          </ListItemButton>
        )}

        {isDeveloperAdmin && (
          <>
            <ListItemButton onClick={() => navigate("/user-management")}>
              <ListItemText primary="User Management" />
            </ListItemButton>

            <ListItemButton
              onClick={() => navigate("/organisation-management")}
            >
              <ListItemText primary="Organisation Management" />
            </ListItemButton>
          </>
        )}

        {isDeveloperMember && (
          <ListItemButton onClick={() => navigate("/project-management")}>
            <ListItemText primary="Project Management" />
          </ListItemButton>
        )}

        {isCP && (
          <ListItemButton onClick={() => navigate("/cp-projects")}>
            <ListItemText primary="Projects" />
          </ListItemButton>
        )}
      </List>
    </Box>
  );
}
