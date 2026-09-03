import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import OrganisationManagement from "./components/OrganisationManagement";
import UserManagement from "./components/UserManagement";
import ProjectManagement from "./components/ProjectManagement";
import ProjectDetails from "./components/ProjectDetails";
import GlobalSnackbar from "./atoms/GlobalSnackbar";
import CPProjects from "./components/CPProjects";
import AIAgents from "./components/AIAgents";

function App() {
  return (
    <>
      <Routes>
        {/* Login / Signup */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected Pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organisation-management"
          element={
            <ProtectedRoute>
              <OrganisationManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-management"
          element={
            <ProtectedRoute>
              <ProjectManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project-management/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-agents"
          element={<AIAgents />}
        />
        <Route
          path="/cp-projects"
          element={
            <ProtectedRoute>
              <CPProjects />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <GlobalSnackbar />
    </>
  );
}

export default App;
