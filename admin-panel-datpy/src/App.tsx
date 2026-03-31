import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login/Login";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import MarcasPage from "./pages/marcas/MarcasPage";
import FamiliasPage from "./pages/familia/FamiliasPage";
import SubFamiliasPage from "./pages/sub_familias/SubFamiliasPage";
import ProductosPage from "./pages/productos/ProductosPage";

interface Props {
  toggleTheme: () => void;
}

function App({ toggleTheme }: Props) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<AdminLayout toggleTheme={toggleTheme} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marcas" element={<MarcasPage />} />
          <Route path="/familias" element={<FamiliasPage />} />
          <Route path="/sub-familias" element={<SubFamiliasPage />} />
          <Route path="/productos" element={<ProductosPage/>}/>
                    <Route path="/clientes" element={<ProductosPage/>}/>
          <Route path="/paises" element={<ProductosPage/>}/>
          <Route path="/departamentos" element={<ProductosPage/>}/>
          <Route path="/distritos" element={<ProductosPage/>}/>
          <Route path="/ciudades" element={<ProductosPage/>}/>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;