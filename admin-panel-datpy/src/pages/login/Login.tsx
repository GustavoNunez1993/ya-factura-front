import { useState } from "react";
import api from "../../services/api";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  InputAdornment,
  CircularProgress
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import BusinessIcon from "@mui/icons-material/Business";

interface LoginForm {
  email: string;
  password: string;
  ruc: string;
}

export default function Login() {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    ruc: ""
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await api.post("/api/auth/signin", form);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      window.location.href = "/dashboard";
    } catch {
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
        backgroundColor: "#f4f6f9"
      }}
    >
      {/* PANEL IZQUIERDO ILUSTRACIÓN */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e293b",
          color: "white",
          flexDirection: "column",
          p: 6
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={2}>
          Tu Plataforma SaaS
        </Typography>

        <Typography variant="body1" sx={{ opacity: 0.7 }}>
          Gestiona productos, marcas y catálogos
          <br />
          desde un solo lugar.
        </Typography>
      </Box>

      {/* PANEL DERECHO FORM */}
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
            width: 400,
            p: 4,
            borderRadius: 4,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            textAlign="center"
            mb={3}
          >
            Panel Administrativo
          </Typography>

          <TextField
            fullWidth
            label="Email"
            margin="normal"
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

          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              height: 48,
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
    </Box>
  );
}