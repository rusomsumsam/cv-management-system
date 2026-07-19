import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const DashboardLayout = () => {
    return (
        <>
            <Sidebar />
            <div>
                <Header />
                <Outlet />
            </div>
        </>
    );
};

export default DashboardLayout;