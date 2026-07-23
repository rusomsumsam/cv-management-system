import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Menu,
    Search,
    Moon,
    Sun,
    Languages,
    ChevronDown,
    UserRound,
    LogOut,
} from "lucide-react";
import useAuth from "../hooks/useAuth";

const Header = ({
    user,
    onOpenSidebar = () => { },
}) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const userMenuRef = useRef(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem("cvms-theme");
        return saved === "dark" ? "dark" : "light";
    });
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem("cvms-language");
        return saved === "bn" ? "bn" : "en";
    });

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

    const translations = {
        en: {
            dashboard: "Dashboard",
            searchPlaceholder: "Search positions, CVs, discussions...",
            profile: "Profile",
            signOut: "Sign out",
            openUserMenu: "Open user menu",
            switchToDark: "Switch to dark theme",
            switchToLight: "Switch to light theme",
        },
        bn: {
            dashboard: "ড্যাশবোর্ড",
            searchPlaceholder: "পজিশন, সিভি ও আলোচনা খুঁজুন...",
            profile: "প্রোফাইল",
            signOut: "সাইন আউট",
            openUserMenu: "ব্যবহারকারী মেনু খুলুন",
            switchToDark: "ডার্ক থিম চালু করুন",
            switchToLight: "লাইট থিম চালু করুন",
        },
    };

    const t = translations[language] || translations.en;

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === "en" ? "bn" : "en"));
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen((prev) => !prev);
    };

    const handleLogout = async () => {
        try {
            await logout();
            setIsUserMenuOpen(false);
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const fullName = getFullName();
    const initials = getInitials();
    const formattedRole = formatRole(user?.role);
    const hasProfilePhoto = Boolean(user?.profilePhoto);

    const role = user?.role?.toLowerCase() || "";

    const getProfilePath = () => {
        if (role === "candidate") {
            return "/profile";
        }

        if (role === "recruiter") {
            return "/recruiter/profile";
        }

        return null;
    };

    const profilePath = getProfilePath();

    useEffect(() => {
        localStorage.setItem("cvms-theme", theme);
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("cvms-language", language);
    }, [language]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target)
            ) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        // Search functionality will be implemented later
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
            {/* Mobile sidebar toggle */}
            <button
                type="button"
                onClick={onOpenSidebar}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
                aria-label="Open navigation"
            >
                <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Dashboard title */}
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t.dashboard}
            </h1>

            {/* Search */}
            <div className="flex flex-1 items-center justify-center px-2 sm:px-4">
                <form
                    onSubmit={handleSearchSubmit}
                    className="relative hidden w-full max-w-md md:block"
                >
                    <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        aria-label="Full-text search"
                        className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                    />
                </form>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Theme switcher */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label={
                        theme === "light" ? t.switchToDark : t.switchToLight
                    }
                    title={
                        theme === "light" ? t.switchToDark : t.switchToLight
                    }
                >
                    {theme === "light" ? (
                        <Moon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                        <Sun className="h-5 w-5" aria-hidden="true" />
                    )}
                </button>

                {/* Language switcher */}
                <button
                    type="button"
                    onClick={toggleLanguage}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    <Languages className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">
                        {language === "en" ? "EN" : "বাংলা"}
                    </span>
                </button>

                {/* User dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        type="button"
                        onClick={toggleUserMenu}
                        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-slate-800"
                        aria-expanded={isUserMenuOpen}
                        aria-haspopup="menu"
                        aria-label={t.openUserMenu}
                    >
                        {hasProfilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={fullName}
                                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                {initials}
                            </div>
                        )}
                        <div className="hidden min-w-0 md:block">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {fullName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {formattedRole}
                            </p>
                        </div>
                        <ChevronDown
                            className={`h-4 w-4 text-slate-500 transition-transform duration-200 dark:text-slate-400 ${isUserMenuOpen ? "rotate-180" : ""
                                }`}
                            aria-hidden="true"
                        />
                    </button>

                    {/* Dropdown menu */}
                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {fullName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {user?.email || ""}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formattedRole}
                                </p>
                            </div>

                            {profilePath && (
                                <Link
                                    to={profilePath}
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <UserRound className="h-4 w-4" aria-hidden="true" />
                                    {t.profile}
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                <LogOut className="h-4 w-4" aria-hidden="true" />
                                {t.signOut}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;