import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SupportTicketModal from "../components/support/SupportTicketModal";
import useAuth from "../hooks/useAuth";

const DashboardLayout = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSupportTicketOpen, setIsSupportTicketOpen] = useState(false);

    const openSidebar = () => {
        setIsSidebarOpen(true);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const openSupportTicket = () => {
        setIsSupportTicketOpen(true);
    };

    const closeSupportTicket = useCallback(() => {
        setIsSupportTicketOpen(false);
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setIsSidebarOpen(false);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [location.pathname]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />

                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Loading application...
                    </p>
                </div>
            </div>
        );
    }

    const currentPageUrl = window.location.href;

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

            <button
                type="button"
                onClick={openSupportTicket}
                className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                aria-label="Create support ticket"
                title="Create support ticket"
            >
                <LifeBuoy
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                />

                <span className="hidden sm:inline">
                    Help
                </span>
            </button>

            <SupportTicketModal
                isOpen={isSupportTicketOpen}
                onClose={closeSupportTicket}
                currentPageUrl={currentPageUrl}
            />
        </div>
    );
};

export default DashboardLayout;