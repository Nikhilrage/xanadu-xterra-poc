import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "../atoms/Navbar";
import Sidebar from "../atoms/Sidebar";


interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const token = localStorage.getItem("accessToken");
  const userString = localStorage.getItem("user");

  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);

  return (
    <>
      <Navbar />

      <Box
        sx={{
          display: "flex",
          mt: "64px",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <Sidebar
          role={user.role}
          userName={user.name}
          userEmail={user.email}
        />

        <Box
          sx={{
            flex: 1,
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </>
  );
}