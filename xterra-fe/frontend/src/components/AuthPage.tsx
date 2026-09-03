import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

const API_URL = "http://localhost:3000";

type AuthMode = "login" | "register";

interface AuthResponse {
  message?: string;
  accessToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("developer_admin");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (localStorage.getItem("accessToken") && localStorage.getItem("user")) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload =
      mode === "register"
        ? { name, email, password, role }
        : { email, password };

    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as AuthResponse;

      if (!response.ok || !data.accessToken || !data.user) {
        throw new Error(data.message ?? "Authentication failed");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the API",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 8, px: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          InXiteOut
        </Typography>

        <Tabs
          value={mode}
          onChange={(_, value: AuthMode) => {
            setMode(value);
            setError("");
          }}
          sx={{ mb: 3 }}
        >
          <Tab value="login" label="Login" />
          <Tab value="register" label="Register" />
        </Tabs>

        <Box component="form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <TextField
              fullWidth
              required
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            required
            // type="email"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            type="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            sx={{ mb: 2 }}
          />

          {mode === "register" && (
            <TextField
              fullWidth
              select
              required
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="developer_admin">Admin</MenuItem>
              <MenuItem value="cp_admin">CP Admin</MenuItem>
            </TextField>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Register"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
