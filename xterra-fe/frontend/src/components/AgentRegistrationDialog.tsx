import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useEffect, useMemo, useState } from "react";
import {
  getAgentEvents,
  getAgentTools,
  getMyOrganisations,
  getToolsForAgentEvent,
  registerAgent,
} from "../api/services";

type RegistryTool = {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
};

type RegistryEvent = {
  id: string;
  key: string;
  name: string;
  description: string;
};

const steps = [
  "Agent Details",
  "Trigger Configuration",
  "Tool Selection",
  "Review & Confirm",
];

export default function AgentRegistrationDialog({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState<RegistryEvent[]>([]);
  const [tools, setTools] = useState<RegistryTool[]>([]);
  const [organisations, setOrganisations] = useState<any[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registration, setRegistration] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "general",
    ownerOrganizationId: "",
    executionMode: "AUTOMATIC" as "AUTOMATIC" | "MANUAL",
    eventIds: [] as string[],
    toolIds: [] as string[],
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      getAgentEvents(),
      getAgentTools(),
      getMyOrganisations().catch(() => []),
    ]).then(([eventData, toolData, organisationData]) => {
      setEvents(eventData);
      setTools(toolData);
      setOrganisations(organisationData);
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setError("");
      setRegistration(null);
      setForm({
        name: "",
        description: "",
        type: "general",
        ownerOrganizationId: "",
        executionMode: "AUTOMATIC",
        eventIds: [],
        toolIds: [],
      });
    }
  }, [open]);

  useEffect(() => {
    if (form.executionMode === "MANUAL") {
      setLoadingTools(true);
      getAgentTools()
        .then(setTools)
        .finally(() => setLoadingTools(false));
      return;
    }
    if (!form.eventIds.length) {
      setTools([]);
      return;
    }
    setLoadingTools(true);
    const selected = events.filter((event) => form.eventIds.includes(event.id));
    Promise.all(selected.map((event) => getToolsForAgentEvent(event.key)))
      .then((responses) => {
        const unique = new Map<string, RegistryTool>();
        responses.forEach((response) =>
          response.tools.forEach((tool: RegistryTool) => unique.set(tool.id, tool)),
        );
        setTools([...unique.values()]);
        setForm((current) => ({
          ...current,
          toolIds: current.toolIds.filter((id) => unique.has(id)),
        }));
      })
      .finally(() => setLoadingTools(false));
  }, [events, form.eventIds, form.executionMode]);

  const selectedEvents = useMemo(
    () => events.filter((event) => form.eventIds.includes(event.id)),
    [events, form.eventIds],
  );
  const selectedTools = useMemo(
    () => tools.filter((tool) => form.toolIds.includes(tool.id)),
    [tools, form.toolIds],
  );

  const validateStep = () => {
    if (step === 0 && (!form.name.trim() || !form.description.trim())) {
      return "Agent name and description are required.";
    }
    if (
      step === 1 &&
      form.executionMode === "AUTOMATIC" &&
      !form.eventIds.length
    ) {
      return "Select at least one event for automatic execution.";
    }
    if (step === 2 && !form.toolIds.length) {
      return "Select at least one tool.";
    }
    return "";
  };

  const next = () => {
    const message = validateStep();
    if (message) return setError(message);
    setError("");
    setStep((current) => current + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await registerAgent({
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        executionMode: form.executionMode,
        toolIds: form.toolIds,
        ...(form.executionMode === "AUTOMATIC"
          ? { eventIds: form.eventIds }
          : {}),
        ...(form.ownerOrganizationId
          ? { ownerOrganizationId: form.ownerOrganizationId }
          : {}),
      });
      setRegistration(result);
      onRegistered();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message || "Unable to register agent.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (value: string) => navigator.clipboard.writeText(value);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700, py: 2.25 }}>
        {registration ? "Agent Registered" : "Register New Agent"}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 16, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />

      {registration ? (
        <>
          <DialogContent sx={{ p: 3 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Agent registered successfully. Save this API key now—it is shown only once.
            </Alert>
            <Typography variant="subtitle2" gutterBottom>Agent ID</Typography>
            <CopyField value={registration.agent.agentId} onCopy={copy} />
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>API Key</Typography>
            <CopyField value={registration.credentials.apiKey} onCopy={copy} />
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>MCP Configuration</Typography>
            <Paper variant="outlined" sx={{ bgcolor: "#111827", color: "#e5e7eb", p: 2, position: "relative" }}>
              <IconButton
                aria-label="Copy MCP configuration"
                onClick={() => copy(JSON.stringify(registration.mcpConfiguration, null, 2))}
                sx={{ position: "absolute", right: 8, top: 8, color: "white" }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <Box component="pre" sx={{ m: 0, pr: 5, whiteSpace: "pre-wrap", fontSize: 13 }}>
                {JSON.stringify(registration.mcpConfiguration, null, 2)}
              </Box>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="contained" onClick={onClose}>Done</Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent sx={{ p: 0, minHeight: 570, display: "flex" }}>
            <Box sx={{ width: 280, borderRight: "1px solid #e5e7eb", p: 3 }}>
              <Stepper activeStep={step} orientation="vertical">
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            <Box sx={{ flex: 1, p: 3.25 }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {step === 0 && (
                <Box sx={{ display: "grid", gap: 2.5 }}>
                  <TextField label="Agent Name" placeholder="Enter agent name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <TextField label="Agent Description" placeholder="Describe what this agent does..." multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <TextField select label="Agent Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="project">Project</MenuItem>
                    <MenuItem value="lead">Lead</MenuItem>
                  </TextField>
                  <FormControl>
                    <FormLabel>Owner / Organization (optional)</FormLabel>
                    <Select displayEmpty value={form.ownerOrganizationId} onChange={(e) => setForm({ ...form, ownerOrganizationId: e.target.value })}>
                      <MenuItem value="">No organization</MenuItem>
                      {organisations.map((org) => <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {step === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>How should this agent run?</Typography>
                  <RadioGroup value={form.executionMode} onChange={(e) => setForm({ ...form, executionMode: e.target.value as "AUTOMATIC" | "MANUAL", eventIds: [], toolIds: [] })} sx={{ my: 2 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}><FormControlLabel value="MANUAL" control={<Radio />} label={<Box><Typography sx={{ fontWeight: 600 }}>Manual</Typography><Typography variant="body2" color="text.secondary">Run explicitly from Xterra.</Typography></Box>} /></Paper>
                    <Paper variant="outlined" sx={{ p: 1.5 }}><FormControlLabel value="AUTOMATIC" control={<Radio />} label={<Box><Typography sx={{ fontWeight: 600 }}>Automatic</Typography><Typography variant="body2" color="text.secondary">Run when selected Xterra events occur.</Typography></Box>} /></Paper>
                  </RadioGroup>
                  {form.executionMode === "AUTOMATIC" && (
                    <Box sx={{ mt: 3 }}>
                      <Typography sx={{ mb: 1, fontWeight: 700 }}>Select events</Typography>
                      {events.map((event) => (
                        <Paper key={event.id} variant="outlined" sx={{ p: 1.25, mb: 1 }}>
                          <FormControlLabel
                            control={<Checkbox checked={form.eventIds.includes(event.id)} onChange={() => setForm((current) => ({ ...current, eventIds: current.eventIds.includes(event.id) ? current.eventIds.filter((id) => id !== event.id) : [...current.eventIds, event.id] }))} />}
                            label={<Box><Typography sx={{ fontWeight: 600 }}>{eventDisplayName(event)}</Typography><Typography variant="body2" color="text.secondary">{event.description}</Typography></Box>}
                          />
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {step === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Select allowed tools</Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {form.executionMode === "AUTOMATIC" ? "Tools relevant to the selected events." : "All active Xterra tools."}
                  </Typography>
                  {loadingTools ? <CircularProgress size={28} /> : tools.map((tool) => (
                    <Paper key={tool.id} variant="outlined" sx={{ p: 1.5, mb: 1.25 }}>
                      <FormControlLabel
                        control={<Checkbox checked={form.toolIds.includes(tool.id)} onChange={() => setForm((current) => ({ ...current, toolIds: current.toolIds.includes(tool.id) ? current.toolIds.filter((id) => id !== tool.id) : [...current.toolIds, tool.id] }))} />}
                        label={<Box><Box sx={{ display: "flex", gap: 1, alignItems: "center" }}><Typography sx={{ fontWeight: 650 }}>{tool.name}</Typography><Chip size="small" label={tool.category} /></Box><Typography variant="body2" color="text.secondary">{tool.description}</Typography></Box>}
                      />
                    </Paper>
                  ))}
                </Box>
              )}

              {step === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Review agent registration</Typography>
                  <Review label="Agent" value={form.name} />
                  <Review label="Description" value={form.description} />
                  <Review label="Trigger" value={form.executionMode === "AUTOMATIC" ? "Event Driven" : "Manual"} />
                  <Review label="Events" value={selectedEvents.map(eventDisplayName).join(", ") || "None"} />
                  <Review label="Tools" value={selectedTools.map((tool) => tool.name).join(", ")} />
                  <Alert severity="info" sx={{ mt: 3 }}>Registering creates the Agent ID, one-time API key, OpenFGA tool permissions, and MCP configuration.</Alert>
                </Box>
              )}
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
            <Button disabled>Save as Draft</Button>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button disabled={step === 0} onClick={() => { setError(""); setStep((current) => current - 1); }}>Previous Step</Button>
              {step < 3 ? <Button variant="contained" onClick={next}>Save & Continue</Button> : <Button variant="contained" disabled={submitting} onClick={submit}>{submitting ? "Registering..." : "Register Agent"}</Button>}
            </Box>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function CopyField({ value, onCopy }: { value: string; onCopy: (value: string) => void }) {
  return <TextField fullWidth value={value} slotProps={{ input: { readOnly: true, endAdornment: <IconButton onClick={() => onCopy(value)}><ContentCopyIcon fontSize="small" /></IconButton> } }} />;
}

function Review({ label, value }: { label: string; value: string }) {
  return <Box sx={{ py: 1.5, borderBottom: "1px solid #e5e7eb", display: "grid", gridTemplateColumns: "150px 1fr", gap: 2 }}><Typography color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 600 }}>{value}</Typography></Box>;
}

function eventDisplayName(event: { key: string; name: string }) {
  if (event.key === "PROJECT_CREATED") return "Project Event";
  if (event.key === "LEAD_CREATED") return "Lead Event";
  return event.name;
}
