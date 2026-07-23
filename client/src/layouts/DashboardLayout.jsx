import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import useAuth from "../hooks/useAuth";

const DashboardLayout = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const openSidebar = () => {
        setIsSidebarOpen(true);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                        Loading application...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar
                user={user}
                isOpen={isSidebarOpen}
                onClose={closeSidebar}
            />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <Header
                    user={user}
                    onOpenSidebar={openSidebar}
                />

                <main className="min-w-0 flex-1 p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;