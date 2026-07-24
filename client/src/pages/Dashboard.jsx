import { Link } from "react-router-dom";
import {
    UserRound,
    ListChecks,
    FolderKanban,
    BriefcaseBusiness,
    FileText,
    MessageSquare,
    Info,
    MapPin,
} from "lucide-react";
import useAuth from "../hooks/useAuth";

const Dashboard = () => {
    const { user } = useAuth();

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

    const formatRole = (role) => {
        if (!role) return "";
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const role = user?.role?.toLowerCase() || "";
    const fullName = getFullName();
    const formattedRole = formatRole(user?.role);

    const quickActions = {
        candidate: [
            {
                label: "Profile",
                description: "View and maintain your personal information.",
                path: "/profile",
                icon: UserRound,
            },
            {
                label: "My Attributes",
                description: "Manage reusable profile attributes and values.",
                path: "/profile/attributes",
                icon: ListChecks,
            },
            {
                label: "Projects",
                description: "Create and maintain your project descriptions.",
                path: "/projects",
                icon: FolderKanban,
            },
            {
                label: "Available Positions",
                description: "Browse positions currently available to candidates.",
                path: "/candidate/positions",
                icon: BriefcaseBusiness,
            },
            {
                label: "My CVs",
                description: "View CVs created for available positions.",
                path: "/my-cvs",
                icon: FileText,
            },
            {
                label: "Discussions",
                description: "View and participate in existing discussions.",
                path: "/discussions",
                icon: MessageSquare,
            },
        ],
        recruiter: [
            {
                label: "Positions",
                description: "Create and manage the shared list of positions.",
                path: "/positions",
                icon: BriefcaseBusiness,
            },
            {
                label: "Attribute Library",
                description: "Create and manage reusable attributes.",
                path: "/attributes",
                icon: ListChecks,
            },
            {
                label: "Discussions",
                description: "View and participate in existing discussions.",
                path: "/discussions",
                icon: MessageSquare,
            },
        ],
        admin: [
            {
                label: "Discussions",
                description: "View and participate in existing discussions.",
                path: "/discussions",
                icon: MessageSquare,
            },
        ],
    };

    const actions = quickActions[role] || [];

    const getRoleDescription = () => {
        switch (role) {
            case "candidate":
                return "Manage your reusable profile information, explore available positions, and create tailored CVs.";
            case "recruiter":
                return "Manage shared positions, maintain the attribute library, and review recruitment activity.";
            case "admin":
                return "Administrative tools will appear here as the Admin module is implemented.";
            default:
                return "Use the available navigation to access your account.";
        }
    };

    const getRoleGuidance = () => {
        switch (role) {
            case "candidate":
                return {
                    title: "Candidate workflow",
                    items: [
                        "Complete your personal profile and reusable attributes.",
                        "Add project information.",
                        "Browse an available position.",
                        "Generate one CV for that position.",
                        "Fill missing information before publishing the CV.",
                    ],
                };
            case "recruiter":
                return {
                    title: "Recruiter workflow",
                    items: [
                        "Create or manage reusable attributes.",
                        "Create and configure a position.",
                        "Add attributes to the position template.",
                        "Review published candidate CVs when the related features are available.",
                        "Participate in position discussions.",
                    ],
                };
            case "admin":
                return {
                    title: "Admin module status",
                    items: [
                        "The Admin module is not implemented yet.",
                        "User and role management will be added in a later phase.",
                        "Only currently working routes should be shown.",
                    ],
                };
            default:
                return {
                    title: "Account navigation",
                    items: ["Use the available sidebar navigation to continue."],
                };
        }
    };

    const getDashboardMessage = () => {
        switch (role) {
            case "candidate":
                return "Live profile, CV, and position statistics will appear here after the required dashboard APIs are implemented.";
            case "recruiter":
                return "Live position, CV, and attribute statistics will appear here after the required dashboard APIs are implemented.";
            case "admin":
                return "Live user and platform statistics will appear here after the Admin dashboard APIs are implemented.";
            default:
                return "Live dashboard information will appear here when data services are available.";
        }
    };

    const guidance = getRoleGuidance();

    return (
        <div className="space-y-6">
            {/* Page Heading */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Manage your CV management activities from one place.
                </p>
            </div>

            {/* Welcome Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Welcome back, {fullName}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {getRoleDescription()}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                Email:
                            </span>
                            <span>{user?.email || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                Role:
                            </span>
                            <span>{formattedRole}</span>
                        </div>
                        {user?.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                <span>{user.location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            {actions.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {actions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <Link
                                    key={action.path}
                                    to={action.path}
                                    className="group flex flex-col gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900 dark:text-white">
                                                {action.label}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                                {action.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Role Guidance */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    {guidance.title}
                </h2>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                    {guidance.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Informational State */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <Info className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Dashboard data
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            {getDashboardMessage()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;