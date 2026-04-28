import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

import "./login.css";
import loginImage from "../../assets/login2.jpeg";
import Swal from "sweetalert2";

export default function Login() {

  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    ruc: "",
    remember: false
  });

  const [loading, setLoading] = useState(false);

const handleSubmit = async () => {

  if (!form.email || !form.password || !form.ruc) {

    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Debe completar todos los campos",
      confirmButtonColor: "#4361ee"
    });

    return;
  }

  try {

    setLoading(true);

    await login(form);

    navigate("/dashboard");

  } catch {

    Swal.fire({
      icon: "error",
      title: "Error de autenticación",
      text: "Credenciales inválidas",
      confirmButtonColor: "#4361ee"
    });

  } finally {

    setLoading(false);

  }

};

  return (

    <div className="login-wrapper">

      {/* ILUSTRACION */}

      <div className="login-left">

        <img
          src={loginImage}
          alt="login"
        />



      </div>

      {/* FORM */}

      <div className="login-right">

        <div className="login-card">

          <div className="login-title">
            Bienvenid@ Nuevamente
          </div>

          <div className="login-sub">
            Ingrese sus credenciales para continuar
          </div>

          {/* EMAIL */}

          <div className="mb-3">

            <label>Email</label>

            <InputText
              className="w-full"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

          </div>

          {/* PASSWORD */}

          <div className="mb-3">

            <label>Password</label>

            <Password
              className="w-full"
              inputClassName="w-full"
              style={{ width: "100%" }}
              inputStyle={{ width: "100%" }}
              feedback={false}
              toggleMask
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

          </div>

          {/* RUC */}

          <div className="mb-3">

            <label>RUC Empresa</label>

            <InputText
              className="w-full"
              value={form.ruc}
              onChange={(e) =>
                setForm({ ...form, ruc: e.target.value })
              }
            />

          </div>

          {/* RECORDAR */}

          <div className="flex align-items-center mb-3">

            <Checkbox
              checked={form.remember}
              onChange={(e) =>
                setForm({ ...form, remember: e.checked || false })
              }
            />

            <label className="ml-2">
              Recordar mis credenciales
            </label>

          </div>

          {/* LOGIN */}

          <Button
            label="Ingresar"
            className="w-full"
            loading={loading}
            onClick={handleSubmit}
          />
          <h5 className="mt-3">
            ¿No tienes una cuenta? <a href="#">Regístrate aquí</a>
          </h5>
          <label>Todos los derechos reservados @DatpyInformatica </label>

        </div>

      </div>

    </div>

  );

}
