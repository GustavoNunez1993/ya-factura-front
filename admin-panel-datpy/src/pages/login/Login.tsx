import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

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
      await login(form);
      navigate("/dashboard");
    } catch (error) {
      alert("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex"
      style={{
        height: "100vh",
        background:
          "linear-gradient(135deg,#0f172a,#1e293b)"
      }}
    >

      {/* PANEL IZQUIERDO */}

      <div
        className="hidden md:flex flex-column justify-content-center"
        style={{
          flex: 1,
          color: "white",
          padding: "80px"
        }}
      >

        <h1 style={{ fontSize: 48, fontWeight: 700 }}>
          Datpy Admin
        </h1>

        <p style={{ opacity: 0.7, maxWidth: 400 }}>
          Plataforma multiempresa para gestión de productos,
          facturación y administración de catálogos.
        </p>

      </div>

      {/* LOGIN */}

      <div
        className="flex align-items-center justify-content-center"
        style={{ flex: 1 }}
      >

        <Card
          style={{
            width: 420,
            borderRadius: 12
          }}
          className="shadow-6 p-4"
        >

          <div className="text-center mb-4">

            <h2 style={{ marginBottom: 8 }}>
              Panel Administrativo
            </h2>

            <span style={{ color: "#64748b" }}>
              Ingrese sus credenciales
            </span>

          </div>

          {/* EMAIL */}

          <div className="mb-3">

            <label>Email</label>

            <span className="p-input-icon-left w-full">
              <i className="pi pi-envelope"/>
              <InputText
                className="w-full"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
              />
            </span>

          </div>

          {/* PASSWORD */}

          <div className="mb-3">

            <label>Password</label>

            <Password
              className="w-full"
              inputClassName="w-full"
              feedback={false}
              toggleMask
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
            />

          </div>

          {/* RUC */}

          <div className="mb-3">

            <label>RUC Empresa</label>

            <span className="p-input-icon-left w-full">
              <i className="pi pi-building"/>
              <InputText
                className="w-full"
                value={form.ruc}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ruc: e.target.value
                  })
                }
              />
            </span>

          </div>

          {/* RECORDAR */}

          <div className="flex justify-content-between align-items-center mb-3">

            <div className="flex align-items-center gap-2">

              <Checkbox
                checked={form.remember}
                onChange={(e) =>
                  setForm({
                    ...form,
                    remember: e.checked || false
                  })
                }
              />

              <label>Recordar sesión</label>

            </div>

            <a href="#" style={{ fontSize: 14 }}>
              ¿Olvidaste tu contraseña?
            </a>

          </div>

          {/* LOGIN */}

          <Button
            label="Ingresar"
            icon="pi pi-sign-in"
            className="w-full"
            severity="primary"
            loading={loading}
            onClick={handleSubmit}
          />

        </Card>

      </div>

    </div>
  );
}