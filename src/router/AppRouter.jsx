import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import CreateMenu from "../pages/Menu/CreateMenu";
import EditMenu from "../pages/Menu/EditMenu";
import MenuHistory from "../pages/Menu/MenuHistory";
import DishesList from "../pages/Dishes/DishesList";

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
