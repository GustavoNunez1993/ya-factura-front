import { Card } from "primereact/card";

export default function Dashboard() {
  return (
    <div>

      <h2 className="mb-4">Dashboard</h2>

      <div className="grid">

        <div className="col-12 md:col-4">
          <Card title="Ventas Hoy">
            <p className="text-xl font-bold">
              0
            </p>
          </Card>
        </div>

        <div className="col-12 md:col-4">
          <Card title="Facturas Emitidas">
            <p className="text-xl font-bold">
              0
            </p>
          </Card>
        </div>

        <div className="col-12 md:col-4">
          <Card title="Productos Activos">
            <p className="text-xl font-bold">
              0
            </p>
          </Card>
        </div>

      </div>

    </div>
  );
}