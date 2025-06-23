/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Box, Typography, TextField, Button, Paper, MenuItem, IconButton, InputAdornment } from "@mui/material";
import { registerUser } from "../data/repositoryAdmin";
import { enqueueSnackbar } from "notistack";
import type { RegisterRequestBody } from "../domain/registerAdminModels";
import { getTokenInfo } from "../../utils/tokenUtils";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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

const idTypeOptions = [
  { label: "Select ID Type", value: "" },
  { label: "Driver's License", value: "DL" },
  { label: "State ID", value: "SI" },
  { label: "Green Card", value: "GC" },
  { label: "Passport", value: "PA" },
];

const CreateAdminView = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (value: string) => {
    setForm({ ...form, phone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Obtén el company_id del token
    const tokenInfo = getTokenInfo();
    const companyId = tokenInfo?.company_id ?? -1; // Usa -1 como fallback si no hay token
    if(form.password.length < 6) {
      enqueueSnackbar("Password must be at least 6 characters long", { variant: "error" });
      return;
    }
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
        id_company: companyId,
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
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                      size="large"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
              autoComplete="email"
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
            <PhoneInput
              country={'us'}
              value={form.phone}
              onChange={handlePhoneChange}
              inputProps={{
                name: 'phone',
                required: true,
                autoFocus: false,
              }}
              inputStyle={{ width: '100%' }}
              specialLabel="Phone"
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
              select
              label="ID Type"
              name="type_id"
              value={form.type_id}
              onChange={handleChange}
              fullWidth
              required
            >
              {idTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
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