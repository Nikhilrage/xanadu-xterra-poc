import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";
import {
  createDeveloperOrganisation,
  createCpOrganisation,
} from "../api/services";
import { showToast } from "../store/toastSlice";
import { useDispatch } from "react-redux";

const CreateOrg = ({ onClose }: any) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    const payload = {
      organisation_details: {
        name,
      },
    };

    try {
      if (type === "developer") {
        await createDeveloperOrganisation(payload);
      }

      if (type === "channel_partner") {
        await createCpOrganisation(payload);
      }

      console.log("Organisation Created");
      dispatch(
        showToast({
          message: "Organisation created successfully",
          severity: "success",
        }),
      );
    } catch (error) {
      console.error(error);
      dispatch(
        showToast({
          message: "Organisation creation failed",
          severity: "error",
        }),
      );
    } finally {
      onClose();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minWidth: 500,
      }}
    >
      <Typography variant="h6">Add Organisation</Typography>

      <TextField
        label="Organisation Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
      />

      <TextField
        select
        label="Organisation Type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        fullWidth
      >
        <MenuItem value="developer">Developer Organisation</MenuItem>

        <MenuItem value="channel_partner">Channel Partner</MenuItem>
      </TextField>

      <TextField
        label="Description (Optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={4}
        fullWidth
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name || !type}
        >
          Create Organisation
        </Button>
      </Box>
    </Box>
  );
};

export default CreateOrg;

// curl --location 'http://localhost:3000/project/createProject' \
// --header 'Authorization: Bearer YOUR_TOKEN' \
// --header 'Content-Type: application/json' \
// --data '{
//   "organizationId": "YOUR_DEVELOPER_ORG_ID",
//   "project_details": {
//     "name": "Lake Shore Project",
//     "location": "Bengaluru",
//     "reraNumber": "RERA-12345",
//     "priceRange": ["50L-75L", "75L-1Cr"],
//     "description": "Lake-facing premium project"
//   }
// }'
