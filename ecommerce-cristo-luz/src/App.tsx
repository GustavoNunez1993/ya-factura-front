import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalogo" element={<Catalog />} />
      <Route path="/producto/:productId" element={<ProductDetail />} />
      <Route path="/carrito" element={<Cart />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/registro" element={<Register />} />
    </Routes>
  );
}

export default App;
