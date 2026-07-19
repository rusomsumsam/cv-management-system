import { Route, Routes } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";

import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";

const AppRoutes = () => {
    return (
        <Routes>

            {/* Public Routes */}

            <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>

            {/* Private Routes */}

            <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
            </Route>

        </Routes>
    );
};

export default AppRoutes;