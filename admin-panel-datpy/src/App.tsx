import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login/Login";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Marcas from "./pages/marcas/Marcas";

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
          <Route path="/marcas" element={<Marcas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;