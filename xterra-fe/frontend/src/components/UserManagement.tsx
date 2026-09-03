import {
  Box,
  Button,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  getAllOrganisations,
  assignDeveloperToOrganisation,
  assignCpToOrganisation,
} from "../api/services";

export default function UserManagement() {
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisationId, setOrganisationId] = useState("");

  const fetchOrganisations = async () => {
    try {
      const response = await getAllOrganisations();

      setOrganisations(response);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const users = organisations.flatMap((org: any) => [
    ...(org.developers || []).map((user: any) => ({
      ...user,
      organisationName: org.name,
    })),
    ...(org.cps || []).map((user: any) => ({
      ...user,
      organisationName: org.name,
    })),
  ]);

  const selectedOrganisation = organisations.find(
    (org: any) => org.id === organisationId,
  );

  const handleSubmit = async () => {
    try {
      if (selectedOrganisation?.type === "developer") {
        await assignDeveloperToOrganisation(organisationId, {
          developer_details: {
            name,
            email,
          },
        });
      }

      if (selectedOrganisation?.type === "cp") {
        await assignCpToOrganisation(organisationId, {
          cp_details: {
            name,
            email,
          },
        });
      }

      setName("");
      setEmail("");
      setOrganisationId("");

      await fetchOrganisations();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        User Management
      </Typography>

      {/* Top Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(450px,1fr))",
          gap: 3,
          mb: 3,
        }}
      >
        {/* Create User */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid #ddd",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Create User
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Organisation"
              value={organisationId}
              onChange={(e) => setOrganisationId(e.target.value)}
              fullWidth
            >
              {organisations.map((org: any) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
        </Paper>

        {/* Bulk Upload */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid #ddd",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 320,
          }}
        >
          <Box
            sx={{
              textAlign: "center",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Bulk Upload
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Upload CSV with users
            </Typography>

            <Button variant="outlined">Bulk Upload CSV</Button>

            <Typography sx={{ my: 2 }}>OR</Typography>

            <Button variant="outlined">Download Template</Button>
          </Box>
        </Paper>
      </Box>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #ddd",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6">Track Users</Typography>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Organisation</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          {/* <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>Developer</TableCell>
              <TableCell>Prestige Group</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>
                <Button size="small" variant="outlined">
                  Invite
                </Button>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Sarah Wilson</TableCell>
              <TableCell>Channel Partner</TableCell>
              <TableCell>Sales CP</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>
                <Button size="small" variant="outlined">
                  Invite
                </Button>
              </TableCell>
            </TableRow>
          </TableBody> */}
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>

                <TableCell>{user.role}</TableCell>

                <TableCell>{user.organisationName}</TableCell>

                <TableCell>Active</TableCell>

                <TableCell>
                  <Button size="small" variant="outlined">
                    Invite
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No Users Found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
