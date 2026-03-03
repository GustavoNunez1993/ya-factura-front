import { Breadcrumbs, Typography, Link } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const routeNameMap: Record<string, string> = {
  dashboard: "Dashboard",
  productos: "Productos",
  marcas: "Marcas",
  familias: "Familias",
  facturas: "Facturas",
  "apertura-caja": "Apertura de Caja",
  "cierre-caja": "Cierre de Caja",
  reportes: "Reportes",
  ventas: "Ventas"
};

export default function BreadcrumbsNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <Breadcrumbs sx={{ mb: 2 }}>
      <Link
        underline="hover"
        color="inherit"
        onClick={() => navigate("/dashboard")}
        sx={{ cursor: "pointer" }}
      >
        Inicio
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        return last ? (
          <Typography key={to} color="text.primary">
            {routeNameMap[value] || value}
          </Typography>
        ) : (
          <Link
            key={to}
            underline="hover"
            color="inherit"
            onClick={() => navigate(to)}
            sx={{ cursor: "pointer" }}
          >
            {routeNameMap[value] || value}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}