import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    User,
    FolderKanban,
    MessageSquare,
    Settings,
    LogOut,
} from "lucide-react";
import api from "../api/axios"; // Adjust the import path to your axios instance

const Sidebar = () => {
    const navigate = useNavigate();

    const navigationItems = [
        {
            path: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            path: "/positions",
            label: "Positions",
            icon: Briefcase,
        },
        {
            path: "/my-cvs",
            label: "My CVs",
            icon: FileText,
        },
        {
            path: "/profile",
            label: "Profile",
            icon: User,
        },
        {
            path: "/projects",
            label: "Projects",
            icon: FolderKanban,
        },
        {
            path: "/discussions",
            label: "Discussions",
            icon: MessageSquare,
        },
    ];

    const bottomItems = [
        {
            path: "/settings",
            label: "Settings",
            icon: Settings,
        },
    ];

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <aside className="flex w-64 min-h-screen flex-col border-r border-slate-200 bg-white">
            {/* Logo Section */}
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600"></div>

                    <span className="text-xl font-bold text-slate-900">
                        CVMS
                    </span>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {navigationItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all ${isActive
                                ? "border border-blue-100 bg-blue-50 font-medium text-blue-600"
                                : "text-slate-600 hover:bg-slate-100"
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Navigation */}
            <div className="space-y-1 px-3 pb-4">
                {bottomItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all ${isActive
                                ? "border border-blue-100 bg-blue-50 font-medium text-blue-600"
                                : "text-slate-600 hover:bg-slate-100"
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;