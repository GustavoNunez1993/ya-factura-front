import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login/Login";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import MarcasPage from "./pages/marcas/MarcasPage";
import FamiliasPage from "./pages/familia/FamiliasPage";
import SubFamiliasPage from "./pages/sub_familias/SubFamiliasPage";
import ProductosPage from "./pages/productos/ProductosPage";
import PersonasPage from "./pages/clientes/PersonasPage";
import BancosPage from "./pages/bancos/BancosPage";
import ProveedoresPage from "./pages/proveedores/ProveedoresPage";
import FacturacionPage from "./pages/facturacion/FacturacionPage";
import AutofacturaPage from "./pages/facturacion/AutofacturaPage";
import NotaRemisionPage from "./pages/facturacion/NotaRemisionPage";
import NotaCreditoPage from "./pages/facturacion/NotaCreditoPage";
import NotaDebitoPage from "./pages/facturacion/NotaDebitoPage";
import TallesPage from "./pages/talles/TallesPage";
import ColoresPage from "./pages/colores/ColoresPage";
import SeleccionProductoColorTallePage from "./pages/SeleccionProductoColorTallePage";
import FacturasListadoPage from "./pages/facturacion/FacturasListadoPage";
import AperturaCajaPage from "./pages/caja/AperturaCajaPage";
import CierreCajaPage from "./pages/caja/CierreCajaPage";
import CanalesVentaPage from "./pages/canales_venta/CanalesVentaPage";
import VendedoresPage from "./pages/vendedores/VendedoresPage";
import CargosPage from "./pages/cargos/CargosPage";
import CondicionesVentaPage from "./pages/condiciones_venta/CondicionesVentaPage";
import CuentaCorrientePage from "./pages/cuenta_corriente/CuentaCorrientePage";
import StockPage from "./pages/stock/StockPage";
import TransferenciasPage from "./pages/stock/TransferenciasPage";
import DepositosPage from "./pages/depositos/DepositosPage";
import MantenimientoPage from "./pages/MantenimientoPage";
import PerfilPage from "./pages/perfil/PerfilPage";
import TimbradosPage from "./pages/timbrados/TimbradosPage";
import EmpresaConfigPage from "./pages/empresa/EmpresaConfigPage";
import CotizacionesPage from "./pages/cotizaciones/CotizacionesPage";
import TenantsFirmadorPage from "./pages/firmador_tenants/TenantsFirmadorPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marcas" element={<MarcasPage />} />
          <Route path="/familias" element={<FamiliasPage />} />
          <Route path="/sub-familias" element={<SubFamiliasPage />} />
          <Route path="/talles" element={<TallesPage />} />
          <Route path="/colores" element={<ColoresPage />} />
          <Route path="/seleccion-producto" element={<SeleccionProductoColorTallePage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/personas" element={<PersonasPage />} />
          <Route path="/bancos" element={<BancosPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route
            path="/facturacion"
            element={
              <FacturasListadoPage
                key="facturacion"
                tipoFijo={1}
                titulo="Facturas"
                subtitulo="Facturas emitidas"
                rutaNuevo="/facturacion-create"
                etiquetaNuevo="Nueva factura"
              />
            }
          />
          <Route
            path="/documentos-electronicos"
            element={
              <FacturasListadoPage
                key="documentos-electronicos"
                titulo="Documentos electrónicos"
                subtitulo="Facturas, notas de crédito y débito, autofacturas y notas de remisión"
              />
            }
          />
          <Route path="/facturacion-create" element={<FacturacionPage />} />
          <Route
            path="/autofacturas"
            element={
              <FacturasListadoPage
                key="autofacturas"
                tipoFijo={4}
                titulo="Autofacturas"
                subtitulo="Compras documentadas a vendedores no contribuyentes"
                rutaNuevo="/autofactura-create"
                etiquetaNuevo="Nueva autofactura"
              />
            }
          />
          <Route path="/autofactura-create" element={<AutofacturaPage />} />
          <Route
            path="/notas-credito"
            element={
              <FacturasListadoPage
                key="notas-credito"
                tipoFijo={5}
                titulo="Notas de crédito"
                subtitulo="Devoluciones, descuentos y ajustes sobre facturas aprobadas"
                rutaNuevo="/nota-credito-create"
                etiquetaNuevo="Nueva nota de crédito"
              />
            }
          />
          <Route path="/nota-credito-create" element={<NotaCreditoPage />} />
          <Route
            path="/notas-debito"
            element={
              <FacturasListadoPage
                key="notas-debito"
                tipoFijo={6}
                titulo="Notas de débito"
                subtitulo="Intereses, ajustes y gastos sobre facturas aprobadas"
                rutaNuevo="/nota-debito-create"
                etiquetaNuevo="Nueva nota de débito"
              />
            }
          />
          <Route path="/nota-debito-create" element={<NotaDebitoPage />} />
          <Route
            path="/notas-remision"
            element={
              <FacturasListadoPage
                key="notas-remision"
                tipoFijo={7}
                titulo="Notas de remisión"
                subtitulo="Traslados de mercadería documentados"
                rutaNuevo="/nota-remision-create"
                etiquetaNuevo="Nueva remisión"
              />
            }
          />
          <Route path="/nota-remision-create" element={<NotaRemisionPage />} />
          <Route path="/apertura-caja" element={<AperturaCajaPage />} />
          <Route path="/cierre-caja" element={<CierreCajaPage />} />
          <Route path="/canales-venta" element={<CanalesVentaPage />} />
          <Route path="/vendedores" element={<VendedoresPage />} />
          <Route path="/cargos" element={<CargosPage />} />
          <Route path="/condiciones-venta" element={<CondicionesVentaPage />} />
          <Route path="/timbrados" element={<TimbradosPage />} />
          <Route path="/empresa" element={<EmpresaConfigPage />} />
          <Route path="/cotizaciones" element={<CotizacionesPage />} />
          <Route path="/firmador-tenants" element={<TenantsFirmadorPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route
            path="/cuenta-corriente/clientes"
            element={<CuentaCorrientePage tipo="clientes" />}
          />
          <Route
            path="/cuenta-corriente/proveedores"
            element={<CuentaCorrientePage tipo="proveedores" />}
          />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/stock/transferencias" element={<TransferenciasPage />} />
          <Route path="/depositos" element={<DepositosPage />} />
          <Route path="/paises" element={<ProductosPage />} />
          <Route path="/departamentos" element={<ProductosPage />} />
          <Route path="/distritos" element={<ProductosPage />} />
          <Route path="/ciudades" element={<ProductosPage />} />
        </Route>

        <Route path="*" element={<MantenimientoPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
