import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login/Login";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import MarcasPage from "./pages/marcas/MarcasPage";
import FamiliasPage from "./pages/familia/FamiliasPage";
import SubFamiliasPage from "./pages/sub_familias/SubFamiliasPage";

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;