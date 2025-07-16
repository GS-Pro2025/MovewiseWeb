/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { 
  TextField, 
  Button, 
  MenuItem, 
  IconButton, 
  InputAdornment,
} from "@mui/material";
import { registerUser } from "../data/repositoryAdmin";
import { enqueueSnackbar } from "notistack";
import type { RegisterRequestBody } from "../domain/registerAdminModels";
import { getTokenInfo } from "../../utils/tokenUtils";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

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
    const companyId = tokenInfo?.company_id ?? -1;
    
    if(form.password.length < 6) {
      enqueueSnackbar("Password must be at least 6 characters long", { variant: "error" });
      setLoading(false);
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
    <div className="min-h-screen py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="bg-white/0 backdrop-blur-md border border-white/40 rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden animate-in fade-in duration-700">
          {/* Animated top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-pulse" style={{ backgroundSize: '200% 100%' }}></div>
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <AdminPanelSettingsIcon className="text-white text-3xl" />
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Register New Admin
            </h1>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 rounded-full border border-blue-200">
              <PersonAddIcon className="text-blue-600 text-sm" />
              <span className="text-blue-700 font-medium text-sm">Administrator Registration</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Account Credentials Section */}
            <div>
              <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
                🔐 Account Credentials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Username"
                  name="user_name"
                  value={form.user_name}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  className="bg-white/90 rounded-lg"
                />
                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  className="bg-white/90 rounded-lg"
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
              </div>
            </div>

            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
                👤 Personal Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="First Name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="outlined"
                    className="bg-white/90 rounded-lg"
                  />
                  <TextField
                    label="Last Name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="outlined"
                    className="bg-white/90 rounded-lg"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    autoComplete="email"
                    variant="outlined"
                    className="bg-white/90 rounded-lg"
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
                    variant="outlined"
                    className="bg-white/90 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Contact & ID Section */}
            <div>
              <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
                📞 Contact & Identification
              </h2>
              <div className="space-y-4">
                {/* Phone and Address in column */}
                <div className="space-y-4">
                  <div className="phone-input-container">
                    <PhoneInput
                      country={'us'}
                      value={form.phone}
                      onChange={handlePhoneChange}
                      inputProps={{
                        name: 'phone',
                        required: true,
                        autoFocus: false,
                      }}
                      inputStyle={{ 
                        width: '100%', 
                        height: '56px',
                        fontSize: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '2px solid rgba(0, 0, 0, 0.23)',
                        borderRadius: '8px',
                        paddingLeft: '48px'
                      }}
                      buttonStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '2px solid rgba(0, 0, 0, 0.23)',
                        borderRight: 'none',
                        borderRadius: '8px 0 0 8px',
                      }}
                      specialLabel="Phone Number"
                    />
                  </div>
                  
                  <TextField
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="outlined"
                    className="bg-white/90 rounded-lg"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="ID Number"
                    name="id_number"
                    value={form.id_number}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="outlined"
                    className="bg-white/90 rounded-lg"
                  />
                  <TextField
                    select
                    label="ID Type"
                    name="type_id"
                    value={form.type_id}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="outlined"
                    className="bg-white/90 rounded-lg"
                  >
                    {idTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
              </div>
            </div>
            
            <div className="pt-6">
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                startIcon={<PersonAddIcon />}
                className="!py-4 !text-lg !font-semibold !bg-gradient-to-r !from-blue-600 !to-purple-600 !hover:from-blue-700 !hover:to-purple-700 !transform !transition-all !duration-300 !hover:-translate-y-1 !hover:shadow-lg !rounded-xl"
              >
                {loading ? "Creating Administrator..." : "Register Administrator"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAdminView;