import { BrowserRouter, Routes, Route } from 'react-router-dom';

/*    IMPORT PAGES    */
import Login from '../pages/Auth/Login';
import Dashboard from '../pages/Dashboard';

import MenuList from '../pages/menu/MenuList';
import CreateMenu from '../pages/menu/CreateMenu';
import EditMenu from '../pages/menu/EditMenu';
import MenuHistory from '../pages/menu/MenuHistory';
import EditMenuMeal from '../pages/menu/EditMenuMeal';
import MenuPiattiFissi from '../pages/menu/MenuPiattiFissi';

import DishesList from '../pages/dishes/DishesList';
import CreateDish from '../pages/dishes/CreateDish';
import EditDish from '../pages/dishes/EditDish';

import StatisticheConsumi from '../pages/Statistiche/StatisticheConsumi.jsx';
import StatisticheScelte from '../pages/Statistiche/StatisticheScelte.jsx';
import UserManagerGestionale from '../pages/users/UserManagerGestionale.jsx';
import UserManagerMobileApp from '../pages/users/UserManagerMobileApp';
import CreateUser from '../pages/users/CreateUser';
import Test from '../pages/Test';

import ProtectedRoute from './ProtectedRoute';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* PUBLIC */}
                <Route path="/login" element={<Login />} />

                {/* PRIVATE */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Menu routes */}
                    <Route path="/menu" element={<MenuList />} />
                    <Route path="/menu/create" element={<CreateMenu />} />
                    <Route
                        path="/menu/edit/:seasonType"
                        element={<EditMenu />}
                    />
                    <Route path="/menu/history" element={<MenuHistory />} />
                    <Route
                        path="/menu/edit/:seasonType/meal/:dayIndex/:mealType"
                        element={<EditMenuMeal />}
                    />
                    <Route
                        path="/menu/edit/:seasonType/piatti_fissi"
                        element={<MenuPiattiFissi />}
                    />

                    {/* Dishes routes */}
                    <Route path="/dishes" element={<DishesList />} />
                    <Route path="/dishes/create" element={<CreateDish />} />
                    <Route path="/dishes/edit/:dishId" element={<EditDish />} />

                    {/* Statistiche routes */}
                    <Route
                        path="/statistiche/consumi"
                        element={<StatisticheConsumi />}
                    />
                    <Route
                        path="/statistiche/scelte"
                        element={<StatisticheScelte />}
                    />
                    <Route
                        path="/user-manager/mobile"
                        element={<UserManagerMobileApp />}
                    />
                    <Route
                        path="/user-manager/gestionale"
                        element={<UserManagerGestionale />}
                    />
                    <Route
                        path="/user-manager/create"
                        element={<CreateUser />}
                    />

                    <Route path="/test" element={<Test />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
