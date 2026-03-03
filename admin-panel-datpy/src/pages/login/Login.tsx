import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  InputAdornment,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Link
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import BusinessIcon from "@mui/icons-material/Business";

interface LoginForm {
  email: string;
  password: string;
  ruc: string;
  remember: boolean;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    ruc: "",
    remember: false
  });

  const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  try {
    setLoading(true);

    console.log("Enviando form:", form);

    await login(form);

    navigate("/dashboard");
  } catch (error) {
    console.log("ERROR COMPLETO:", error);
    alert("Credenciales inválidas");
  } finally {
    setLoading(false);
  }
};

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        backgroundColor: "#f8fafc"
      }}
    >
      {/* PANEL IZQUIERDO */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "white",
          flexDirection: "column",
          p: 8
        }}
      >
        <Typography variant="h3" fontWeight="bold" mb={2}>
          Datpy Admin
        </Typography>

        <Typography sx={{ opacity: 0.6, textAlign: "center", maxWidth: 400 }}>
          Plataforma multiempresa para gestión de productos,
          marcas y catálogos digitales.
        </Typography>
      </Box>

      {/* PANEL DERECHO */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Card
          sx={{
            width: 420,
            p: 5,
            borderRadius: 5,
            boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
            animation: "fadeIn 0.6s ease-in-out"
          }}
        >
          <Box textAlign="center" mb={3}>
            <Typography
              variant="h5"
              fontWeight="bold"
              color="#0f172a"
            >
              PANEL ADMINISTRATIVO
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Email"
            margin="normal"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="RUC Empresa"
            margin="normal"
            value={form.ruc}
            onChange={(e) =>
              setForm({ ...form, ruc: e.target.value })
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon />
                </InputAdornment>
              )
            }}
          />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={2}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.remember}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      remember: e.target.checked
                    })
                  }
                />
              }
              label="Recordar sesión"
            />

            <Link
              href="#"
              underline="hover"
              fontSize={14}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              height: 50,
              fontWeight: "bold",
              borderRadius: 3,
              backgroundColor: "#2563eb",
              "&:hover": {
                backgroundColor: "#1d4ed8"
              }
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Ingresar"
            )}
          </Button>
        </Card>
      </Box>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
}