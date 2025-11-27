import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import CreateMenu from "../pages/menu/CreateMenu";
import EditMenu from "../pages/menu/EditMenu";
import MenuHistory from "../pages/menu/MenuHistory";
import DishesList from "../pages/dishes/DishesList";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/menu/create" element={<CreateMenu />} />
        <Route path="/menu/edit" element={<EditMenu />} />
        <Route path="/menu/history" element={<MenuHistory />} />

        <Route path="/dishes" element={<DishesList />} />

      </Routes>
    </BrowserRouter>
  );
}
