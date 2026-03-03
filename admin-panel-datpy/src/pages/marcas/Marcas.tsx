import { useEffect, useState } from "react";
import api from "../../services/api";
import { Button, TextField } from "@mui/material";

interface Marca {
  id: string;
  nombre: string;
}

export default function Marcas() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [nombre, setNombre] = useState("");

  const fetchMarcas = async () => {
    const res = await api.get("/api/admin/marcas");
    setMarcas(res.data);
  };

  const crearMarca = async () => {
    await api.post("/api/admin/marcas", { nombre });
    fetchMarcas();
    setNombre("");
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  return (
    <>
      <h2>Marcas</h2>

      <TextField
        label="Nueva Marca"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      <Button onClick={crearMarca}>Guardar</Button>

      <ul>
        {marcas.map((m) => (
          <li key={m.id}>{m.nombre}</li>
        ))}
      </ul>
    </>
  );
}