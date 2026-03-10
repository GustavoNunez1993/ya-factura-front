import { useEffect, useState } from "react";
import api from "../../services/api";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

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

    if (!nombre.trim()) return;

    await api.post("/api/admin/marcas", { nombre });

    setNombre("");
    fetchMarcas();
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  return (
    <div>

      <div className="flex align-items-center gap-2 mb-3">

        <InputText
          placeholder="Nueva Marca"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <Button
          label="Guardar"
          icon="pi pi-check"
          severity="success"
          onClick={crearMarca}
        />

      </div>

      <DataTable
        value={marcas}
        paginator
        rows={10}
        stripedRows
        showGridlines
      >

        <Column
          field="nombre"
          header="Nombre de Marca"
          sortable
        />

      </DataTable>

    </div>
  );
}