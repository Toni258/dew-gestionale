// Routing component for app router.
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// PAGES LOADED IMMEDIATELY
import Login from '../pages/Auth/Login';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import { IdleLogoutProvider } from '../context/IdleLogoutContext';

// LAZY PAGES
const MenuList = lazy(() => import('../pages/menu/MenuList'));
const CreateMenu = lazy(() => import('../pages/menu/CreateMenu'));
const EditMenu = lazy(() => import('../pages/menu/EditMenu'));
const EditMenuMeal = lazy(() => import('../pages/menu/EditMenuMeal'));
const MenuPiattiFissi = lazy(() => import('../pages/menu/MenuPiattiFissi'));

const MenuHistory = lazy(() => import('../pages/menu/archived/MenuHistory'));
const ViewArchivedMenu = lazy(
    () => import('../pages/menu/archived/ViewArchivedMenu'),
);
const ArchivedMenuPiattiFissi = lazy(
    () => import('../pages/menu/archived/ArchivedMenuPiattiFissi'),
);
const ViewArchivedMenuMeal = lazy(
    () => import('../pages/menu/archived/ViewArchivedMenuMeal'),
);

const DishesList = lazy(() => import('../pages/dishes/DishesList'));
const CreateDish = lazy(() => import('../pages/dishes/CreateDish'));
const EditDish = lazy(() => import('../pages/dishes/EditDish'));

const StatisticheConsumi = lazy(
    () => import('../pages/Statistiche/StatisticheConsumi'),
);
const StatisticheScelte = lazy(
    () => import('../pages/Statistiche/StatisticheScelte'),
);

const UserManagerGestionale = lazy(
    () => import('../pages/users/UserManagerGestionale'),
);
const UserManagerMobileApp = lazy(
    () => import('../pages/users/UserManagerMobileApp'),
);
const CreateUserGestionale = lazy(
    () => import('../pages/users/CreateUserGestionale'),
);

function RouteFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-background text-brand-text">
            Caricamento...
        </div>
    );
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <IdleLogoutProvider>
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        {/* PUBLIC */}
                        <Route
                            path="/"
                            element={<Navigate to="/dashboard" replace />}
                        />
                        <Route path="/login" element={<Login />} />

                        {/* PRIVATE */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<Dashboard />} />

                            {/* Menu routes */}
                            <Route path="/menu" element={<MenuList />} />
                            <Route
                                path="/menu/create"
                                element={<CreateMenu />}
                            />
                            <Route
                                path="/menu/edit/:seasonType"
                                element={<EditMenu />}
                            />
                            <Route
                                path="/menu/edit/:seasonType/meal/:dayIndex/:mealType"
                                element={<EditMenuMeal />}
                            />
                            <Route
                                path="/menu/edit/:seasonType/piatti_fissi"
                                element={<MenuPiattiFissi />}
                            />

                            {/* Menu archiviati routes */}
                            <Route
                                path="/menu-archived/history"
                                element={<MenuHistory />}
                            />
                            <Route
                                path="/menu-archived/view-archived/:id_arch_menu"
                                element={<ViewArchivedMenu />}
                            />
                            <Route
                                path="/menu-archived/piatti-fissi/:id_arch_menu"
                                element={<ArchivedMenuPiattiFissi />}
                            />
                            <Route
                                path="/menu-archived/view-archived/:id_arch_menu/meal/:dayIndex/:mealType"
                                element={<ViewArchivedMenuMeal />}
                            />

                            {/* Dishes routes */}
                            <Route path="/dishes" element={<DishesList />} />
                            <Route
                                path="/dishes/create"
                                element={<CreateDish />}
                            />
                            <Route
                                path="/dishes/edit/:dishId"
                                element={<EditDish />}
                            />

                            {/* Statistiche routes */}
                            <Route
                                path="/statistiche/consumi"
                                element={<StatisticheConsumi />}
                            />
                            <Route
                                path="/statistiche/scelte"
                                element={<StatisticheScelte />}
                            />

                            {/* User manager routes */}
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
                                element={<CreateUserGestionale />}
                            />
                        </Route>
                    </Routes>
                </Suspense>
            </IdleLogoutProvider>
        </BrowserRouter>
    );
}
