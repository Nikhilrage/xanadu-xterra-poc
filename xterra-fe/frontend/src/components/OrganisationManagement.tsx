import { Box, Button, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import CreateOrg from "./CreateOrg";
import AppModal from "../atoms/AppModal";
import { getAllOrganisations } from "../api/services";

export default function OrganisationManagement() {
  const [openCreateOrgModal, setOpenCreateOrgModal] = useState(false);
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [selectedOrganisation, setSelectedOrganisation] = useState<any>(null);

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

  const getOrgInitials = (name: string) => {
    const words = name.trim().split(" ");

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const capitalizeWords = (text: string) => {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      <Box>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5">Organisation Management</Typography>

          <Button
            variant="contained"
            sx={{
              background: "white",
              color: "black",
            }}
            onClick={() => setOpenCreateOrgModal(true)}
          >
            Create Organisation
          </Button>
        </Box>

        {/* Main Layout */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            minHeight: "600px",
            border: "1px solid #ddd",
            borderRadius: 3,
          }}
        >
          {/* Left Side */}
          <Box
            sx={{
              width: 320,
              borderRight: "1px solid #ddd",
              p: 2,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                pb: 1,
                borderBottom: "1px solid #ddd",
              }}
            >
              Organisations
            </Typography>

            {organisations.map((org: any) => (
              <Box
                key={org.id}
                onClick={() => setSelectedOrganisation(org)}
                sx={{
                  p: 2,
                  mb: 1,
                  border:
                    selectedOrganisation?.id === org.id
                      ? "2px solid #1976d2"
                      : "1px solid #ddd",
                  borderRadius: 2,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "#fafafa",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #ddd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {getOrgInitials(org.name)}
                    </Box>

                    <Box>
                      <Typography
                        fontWeight={600}
                        sx={{
                          fontSize: 14,
                        }}
                      >
                        {capitalizeWords(org.name)}
                      </Typography>

                      <Box
                        sx={{
                          mt: 0.5,
                          display: "inline-flex",
                          px: 1,
                          py: 0.3,
                          borderRadius: 1,
                          fontSize: "10px",
                          fontWeight: 600,
                          backgroundColor:
                            org.type === "developer" ? "#FFF8E1" : "#E3F2FD",
                          color:
                            org.type === "developer" ? "#F57F17" : "#1565C0",
                        }}
                      >
                        {org.type === "developer"
                          ? "Developer"
                          : "Channel Partner"}
                      </Box>
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: 22,
                      color: "#999",
                    }}
                  >
                    ›
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Right Side */}
          <Box
            sx={{
              flex: 1,
              p: 3,
            }}
          >
            {!selectedOrganisation ? (
              <Typography>Select an organisation.</Typography>
            ) : (
              <>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {capitalizeWords(selectedOrganisation.name)}
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography>
                      {selectedOrganisation.type === "developer"
                        ? "Developers"
                        : "Channel Partners"}
                    </Typography>
                  </Box>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px 16px",
                            borderTop: "1px solid #ddd",
                            borderBottom: "1px solid #ddd",
                          }}
                        >
                          Name
                        </th>

                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px 16px",
                            borderTop: "1px solid #ddd",
                            borderBottom: "1px solid #ddd",
                          }}
                        >
                          Email
                        </th>

                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px 16px",
                            borderTop: "1px solid #ddd",
                            borderBottom: "1px solid #ddd",
                          }}
                        >
                          Role
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {(selectedOrganisation.type === "developer"
                        ? selectedOrganisation.developers
                        : selectedOrganisation.cps
                      )?.map((user: any) => (
                        <tr key={user.id}>
                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {user.name}
                          </td>

                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {user.email}
                          </td>

                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {user.role}
                          </td>
                        </tr>
                      ))}

                      {(selectedOrganisation.type === "developer"
                        ? selectedOrganisation.developers
                        : selectedOrganisation.cps
                      )?.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            style={{
                              padding: "20px",
                              textAlign: "center",
                            }}
                          >
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Paper>
              </>
            )}
          </Box>
        </Paper>
      </Box>

      <AppModal
        open={openCreateOrgModal}
        onClose={() => setOpenCreateOrgModal(false)}
        title="Add Organisation"
      >
        <CreateOrg
          onClose={() => {
            fetchOrganisations();
            setOpenCreateOrgModal(false);
          }}
        />
      </AppModal>
    </>
  );
}
