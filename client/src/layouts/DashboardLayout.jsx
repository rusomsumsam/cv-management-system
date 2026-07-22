import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const DashboardLayout = () => {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />

            <div className="flex flex-1 flex-col">
                <Header />

                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;