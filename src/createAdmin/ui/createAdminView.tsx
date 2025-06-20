/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import { registerUser } from "../data/repositoryAdmin";
import { enqueueSnackbar } from "notistack";
import type { RegisterRequestBody } from "../domain/registerAdminModels";

// Simula obtener el id_company (puedes reemplazar esto por tu lógica real)
const getCompanyId = () => 1;

const initialForm = {
  user_name: "",
  password: "",
  email: "",
  first_name: "",
  last_name: "",
  birth_date: "",
  phone: "",
  address: "",
  id_number: "",
  type_id: "",
};

const CreateAdminView = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend: RegisterRequestBody = {
      user_name: form.user_name,
      password: form.password,
      person: {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date,
        phone: form.phone,
        address: form.address,
        id_number: form.id_number,
        type_id: form.type_id,
        id_company: getCompanyId(),
      },
    };

    try {
      const result = await registerUser(dataToSend);
      if (result.success) {
        enqueueSnackbar("Admin registered successfully!", { variant: "success" });
        setForm(initialForm);
      } else {
        enqueueSnackbar(result.errorMessage || "Error registering admin", { variant: "error" });
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || "Unexpected error", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 5 }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
        <Typography variant="h5" gutterBottom>
          Register New Admin
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Username"
              name="user_name"
              value={form.user_name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="First Name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Birth Date"
              name="birth_date"
              type="date"
              value={form.birth_date}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="ID Number"
              name="id_number"
              value={form.id_number}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="ID Type"
              name="type_id"
              value={form.type_id}
              onChange={handleChange}
              fullWidth
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateAdminView;