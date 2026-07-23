import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    UserRound,
    ListChecks,
    FolderKanban,
    BriefcaseBusiness,
    FileText,
    MessageSquare,
    X,
} from "lucide-react";

const Sidebar = ({
    user,
    isOpen = false,
    onClose = () => { },
}) => {
    const role = user?.role?.toLowerCase() || "";

    const getFullName = () => {
        const firstName = user?.firstName;
        const lastName = user?.lastName;

        if (firstName || lastName) {
            return [firstName, lastName].filter(Boolean).join(" ");
        }

        if (user?.email) {
            return user.email;
        }

        return "User";
    };

    const getInitials = () => {
        const firstName = user?.firstName;
        const lastName = user?.lastName;

        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }

        if (firstName) {
            return firstName.charAt(0).toUpperCase();
        }

        if (lastName) {
            return lastName.charAt(0).toUpperCase();
        }

        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }

        return "U";
    };

    const formatRole = (role) => {
        if (!role) return "";

        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const sidebarMenus = {
        candidate: [
            {
                label: "Dashboard",
                path: "/dashboard",
                icon: LayoutDashboard,
                end: true,
            },
            {
                label: "Profile",
                path: "/profile",
                icon: UserRound,
                end: true,
            },
            {
                label: "My Attributes",
                path: "/profile/attributes",
                icon: ListChecks,
            },
            {
                label: "Projects",
                path: "/projects",
                icon: FolderKanban,
            },
            {
                label: "Available Positions",
                path: "/candidate/positions",
                icon: BriefcaseBusiness,
            },
            {
                label: "My CVs",
                path: "/my-cvs",
                icon: FileText,
                end: true,
            },
            {
                label: "Discussions",
                path: "/discussions",
                icon: MessageSquare,
            },
        ],

        recruiter: [
            {
                label: "Dashboard",
                path: "/dashboard",
                icon: LayoutDashboard,
                end: true,
            },
            {
                label: "Profile",
                path: "/recruiter/profile",
                icon: UserRound,
                end: true,
            },
            {
                label: "Positions",
                path: "/positions",
                icon: BriefcaseBusiness,
            },
            {
                label: "Attribute Library",
                path: "/attributes",
                icon: ListChecks,
            },
            {
                label: "Discussions",
                path: "/discussions",
                icon: MessageSquare,
            },
        ],

        admin: [
            {
                label: "Dashboard",
                path: "/dashboard",
                icon: LayoutDashboard,
                end: true,
            },
            {
                label: "Discussions",
                path: "/discussions",
                icon: MessageSquare,
            },
        ],
    };

    const menuItems = sidebarMenus[role] || [];

    const handleLinkClick = () => {
        onClose();
    };

    const fullName = getFullName();
    const initials = getInitials();
    const formattedRole = formatRole(role);
    const hasProfilePhoto = Boolean(user?.profilePhoto);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={onClose}
                    aria-label="Close sidebar"
                />
            )}

            {/* Sidebar */}
            <aside
                aria-label="Main navigation"
                className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-slate-200 bg-white
          transition-transform duration-300 ease-in-out
          dark:border-slate-800 dark:bg-slate-900
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                    <NavLink
                        to="/dashboard"
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                            CV
                        </div>

                        <div>
                            <div className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                                CV Management
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                Recruitment Platform
                            </div>
                        </div>
                    </NavLink>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-slate-800 lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X
                            className="h-5 w-5 text-slate-500 dark:text-slate-400"
                            aria-hidden="true"
                        />
                    </button>
                </div>

                {/* User Section */}
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        {hasProfilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={fullName}
                                className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                {initials}
                            </div>
                        )}

                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {fullName}
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {formattedRole}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Main menu
                    </div>

                    {menuItems.length > 0 ? (
                        <ul className="space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            end={item.end}
                                            onClick={handleLinkClick}
                                            className={({ isActive }) =>
                                                `
                          flex items-center gap-3 rounded-lg px-3 py-2
                          text-sm font-medium transition-colors
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${isActive
                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                                }
                        `
                                            }
                                        >
                                            <Icon
                                                className="h-4 w-4 shrink-0"
                                                aria-hidden="true"
                                            />

                                            <span>{item.label}</span>
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                            No navigation menu is available for this role.
                        </div>
                    )}
                </nav>

                {/* Footer */}
                <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                        CV Management System
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;