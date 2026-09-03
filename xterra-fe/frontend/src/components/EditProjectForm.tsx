import { Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { updateProject } from "../api/services";

interface Props {
  project: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProjectForm({
  project,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState(project.name || "");
  const [location, setLocation] = useState(project.location || "");
  const [reraNumber, setReraNumber] = useState(project.reraNumber || "");
  const [description, setDescription] = useState(project.description || "");

  const [priceRange, setPriceRange] = useState<string[]>(
    project.priceRange || [],
  );

  const [priceInput, setPriceInput] = useState("");

  const addPriceRange = () => {
    if (!priceInput.trim() || priceRange.includes(priceInput)) {
      return;
    }

    setPriceRange([...priceRange, priceInput.trim()]);

    setPriceInput("");
  };

  const removePriceRange = (value: string) => {
    setPriceRange(priceRange.filter((item) => item !== value));
  };

  const handleSave = async () => {
    try {
      await updateProject(project.id, {
        project_details: {
          name,
          location,
          reraNumber,
          priceRange,
          description,
        },
      });

      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ minWidth: 600 }}>
      <Stack spacing={3}>
        <Typography variant="h6" fontWeight={600}>
          Edit Project
        </Typography>

        <TextField
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />

        <TextField
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          fullWidth
        />

        <TextField
          label="RERA Number"
          value={reraNumber}
          onChange={(e) => setReraNumber(e.target.value)}
          fullWidth
        />

        <TextField
          label="Description"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
        />

        <Box>
          <Typography sx={{ mb: 1 }} fontWeight={500}>
            Price Ranges
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              mb: 2,
            }}
          >
            <TextField
              label="Price Range"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              fullWidth
              size="small"
            />

            <Button variant="outlined" onClick={addPriceRange}>
              Add
            </Button>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            {priceRange.map((item) => (
              <Chip
                key={item}
                label={item}
                onDelete={() => removePriceRange(item)}
              />
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
