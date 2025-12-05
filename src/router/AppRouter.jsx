import { BrowserRouter, Routes, Route } from 'react-router-dom';

/*    IMPORT PAGES    */
import Login from '../pages/Auth/Login';
import Dashboard from '../pages/Dashboard';

import CreateMenu from '../pages/menu/CreateMenu';
import EditMenu from '../pages/menu/EditMenu';
import MenuHistory from '../pages/menu/MenuHistory';

import DishesList from '../pages/dishes/DishesList';
import CreateDish from '../pages/dishes/CreateDish';
import EditDish from '../pages/dishes/EditDish';

import Report from '../pages/Report';
import UserManager from '../pages/UserManager';

import Test from '../pages/Test';

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
                <Route path="/dishes/create" element={<CreateDish />} />
                <Route path="/dishes/edit/:dishId" element={<EditDish />} />

                <Route path="/statistics" element={<Report />} />
                <Route path="/user-manager" element={<UserManager />} />

                <Route path="/test" element={<Test />} />
            </Routes>
        </BrowserRouter>
    );
}
