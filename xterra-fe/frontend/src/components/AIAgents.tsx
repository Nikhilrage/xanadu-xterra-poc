import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { useCallback, useEffect, useState } from "react";
import {
  getAgentById,
  getAgentExecutions,
  getAgents,
  runAgent,
  updateAgentStatus,
} from "../api/services";
import AgentRegistrationDialog from "./AgentRegistrationDialog";

export default function AIAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [runTarget, setRunTarget] = useState<any>(null);
  const [runInput, setRunInput] = useState("");
  const [runResult, setRunResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      setAgents(await getAgents());
      setError("");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Unable to load agents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const viewDetails = async (agent: any) => {
    const [agentDetails, history] = await Promise.all([
      getAgentById(agent.agentId),
      getAgentExecutions(agent.agentId),
    ]);
    setDetails(agentDetails);
    setExecutions(history);
  };

  const toggleStatus = async (agent: any) => {
    await updateAgentStatus(agent.agentId, agent.status === "ACTIVE" ? "DISABLED" : "ACTIVE");
    await loadAgents();
  };

  const execute = async () => {
    setRunning(true);
    try {
      setRunResult(await runAgent(runTarget.agentId, { input: runInput }));
      await loadAgents();
    } catch (requestError: any) {
      setRunResult({ error: requestError?.response?.data?.message || "Agent execution failed." });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box sx={{ mx: -3, my: -3, minHeight: "calc(100vh - 64px)", bgcolor: "#f5f7fb", p: 9 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 750 }}>AI Agents</Typography>
          <Typography color="text.secondary" sx={{ mt: .5 }}>Register, govern, and monitor agents connected to Xterra.</Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setRegistrationOpen(true)} sx={{ px: 3, py: 1.25, borderRadius: 2 }}>Register Agent</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {loading ? <Box sx={{ display: "grid", placeItems: "center", py: 12 }}><CircularProgress /></Box> : agents.length === 0 ? (
        <Paper variant="outlined" sx={{ textAlign: "center", py: 10, borderRadius: 3 }}>
          <SmartToyOutlinedIcon sx={{ fontSize: 52, color: "#94a3b8" }} />
          <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>No agents registered</Typography>
          <Typography color="text.secondary" sx={{ mt: .5, mb: 2 }}>Create the first governed AI agent for Xterra.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRegistrationOpen(true)}>Register Agent</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 3 }}>
          {agents.map((agent) => (
            <Paper key={agent.id} variant="outlined" sx={{ p: 3, borderRadius: 3, minHeight: 330, display: "flex", flexDirection: "column", boxShadow: "0 2px 6px rgba(15,23,42,.05)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 750 }}>{agent.name}</Typography>
                <Chip size="small" label={agent.status === "ACTIVE" ? "Active" : "Inactive"} sx={{ bgcolor: agent.status === "ACTIVE" ? "#e9fbf0" : "#f1f5f9", color: agent.status === "ACTIVE" ? "#18733b" : "#526074", border: "1px solid", borderColor: agent.status === "ACTIVE" ? "#c5efd4" : "#d8e0ea" }} />
              </Box>
              <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7, flex: 1 }}>{agent.description || <i>No description added yet.</i>}</Typography>
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary"><b>Trigger Type:</b> {agent.executionMode === "AUTOMATIC" ? "Event Driven" : "Manual"}</Typography>
                <Typography variant="body2" color="#94a3b8" sx={{ mt: .75 }}>Registration Date: {new Date(agent.createdAt).toLocaleDateString()}</Typography>
              </Box>
              <Divider sx={{ my: 2.5 }} />
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                {agent.executionMode === "MANUAL" && <Button variant="outlined" onClick={() => { setRunTarget(agent); setRunResult(null); setRunInput(""); }}>Run agent</Button>}
                <Button variant="contained" color="inherit" onClick={() => viewDetails(agent)}>View Agent Details</Button>
                <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}><Switch size="small" checked={agent.status === "ACTIVE"} onChange={() => toggleStatus(agent)} /></Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <AgentRegistrationDialog open={registrationOpen} onClose={() => setRegistrationOpen(false)} onRegistered={loadAgents} />

      <Dialog open={Boolean(details)} onClose={() => setDetails(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Agent Details</DialogTitle>
        <DialogContent dividers>
          {details && <Box sx={{ display: "grid", gap: 2 }}>
            <Detail label="Agent ID" value={details.agentId} />
            <Detail label="Name" value={details.name} />
            <Detail label="Status" value={details.status} />
            <Detail label="Trigger" value={details.executionMode} />
            <Detail label="Events" value={details.events?.map(eventDisplayName).join(", ") || "None"} />
            <Detail label="Tools" value={details.tools?.map((tool: any) => tool.name).join(", ") || "None"} />
            <Divider />
            <Typography sx={{ fontWeight: 700 }}>Recent executions</Typography>
            {executions.length ? executions.slice(0, 5).map((execution) => <Paper key={execution.id} variant="outlined" sx={{ p: 1.5 }}><Box sx={{ display: "flex", justifyContent: "space-between" }}><Typography variant="body2" sx={{ fontWeight: 600 }}>{execution.runCode}</Typography><Chip size="small" label={execution.status} /></Box><Typography variant="caption" color="text.secondary">{execution.triggerSource} · {new Date(execution.createdAt).toLocaleString()}</Typography></Paper>) : <Typography color="text.secondary">No executions yet.</Typography>}
          </Box>}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetails(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(runTarget)} onClose={() => setRunTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Run {runTarget?.name}</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth multiline minRows={3} label="Instructions" placeholder="Tell the agent what to do..." value={runInput} onChange={(e) => setRunInput(e.target.value)} />
          {runResult && <Alert severity={runResult.error || runResult.status === "FAILED" ? "error" : "success"} sx={{ mt: 2 }}><Box component="pre" sx={{ whiteSpace: "pre-wrap", m: 0 }}>{JSON.stringify(runResult, null, 2)}</Box></Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setRunTarget(null)}>Close</Button><Button variant="contained" disabled={running} onClick={execute}>{running ? "Running..." : "Run Agent"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography>{value}</Typography></Box>;
}

function eventDisplayName(event: { key: string; name: string }) {
  if (event.key === "PROJECT_CREATED") return "Project Event";
  if (event.key === "LEAD_CREATED") return "Lead Event";
  return event.name;
}
