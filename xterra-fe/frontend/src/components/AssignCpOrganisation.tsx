import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  getAllOrganisations,
  assignCpOrganisationToProject,
  reAssignCpOrganisationToProject,
} from "../api/services";

const AssignCpOrganisation = ({
  project,
  onClose,
  onSuccess,
  isReassignment,
}: any) => {
  const [cpOrgs, setCpOrgs] = useState<any[]>([]);

  useEffect(() => {
    const loadCpOrgs = async () => {
      try {
        const response = await getAllOrganisations();

        setCpOrgs(response.filter((org: any) => org.type === "cp"));
      } catch (e) {
        console.error(e);
      }
    };

    loadCpOrgs();
  }, []);

  const handleAssign = async (cpOrgId: string) => {
    try {
      if (isReassignment) {
        await reAssignCpOrganisationToProject(project.id, cpOrgId);
      } else {
        await assignCpOrganisationToProject(project.id, cpOrgId);
      }

      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box>
      <Typography mb={2}>Select CP Organisation</Typography>

      <List>
        {cpOrgs.map((org) => (
          <ListItemButton key={org.id} onClick={() => handleAssign(org.id)}>
            <ListItemText primary={org.name} />
          </ListItemButton>
        ))}
      </List>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: 2,
        }}
      >
        <Button onClick={onClose}>Close</Button>
      </Box>
    </Box>
  );
};

export default AssignCpOrganisation;
