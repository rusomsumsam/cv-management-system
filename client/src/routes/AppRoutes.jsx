import { Route, Routes } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";

import Dashboard from "../pages/Dashboard";
import Positions from "../pages/Positions";
import Profile from "../pages/Profile";
import CVs from "../pages/CVs";
import Projects from "../pages/Projects";
import Discussions from "../pages/Discussions";
import PositionDetails from "../pages/PositionDetails";
import ProtectedRoute from "./ProtectedRoute";

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
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/positions" element={<Positions />} />
                <Route path="/positions/:id" element={<PositionDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-cvs" element={<CVs />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/discussions" element={<Discussions />} />
            </Route>

        </Routes>
    );
};

export default AppRoutes;