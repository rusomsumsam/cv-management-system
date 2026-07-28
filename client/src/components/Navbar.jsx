import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Moon,
    Sun,
    Search,
    Languages,
    Menu,
    X,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import logo from "../assets/img/logo.png";

const Navbar = () => {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('cvms-theme');
        return saved === 'dark' ? 'dark' : 'light';
    });
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('cvms-language');
        return saved === 'bn' ? 'bn' : 'en';
    });
    const navigate = useNavigate();

    // Theme effect
    useEffect(() => {
        localStorage.setItem('cvms-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Language effect
    useEffect(() => {
        localStorage.setItem('cvms-language', language);
    }, [language]);

    // Role and profile path
    const role = typeof user?.role === 'string' ? user.role.toUpperCase() : '';
    const getProfilePath = () => {
        if (role === 'CANDIDATE') return '/profile';
        if (role === 'RECRUITER') return '/recruiter/profile';
        return null;
    };
    const profilePath = getProfilePath();

    // Translations
    const translations = {
        en: {
            home: 'Home',
            positions: 'Positions',
            searchPositions: 'Search Positions',
            dashboard: 'Dashboard',
            profile: 'Profile',
            login: 'Login',
            register: 'Get Started',
            logout: 'Logout',
            loading: 'Loading...',
            toggleMenu: 'Toggle menu',
            switchToDark: 'Switch to dark theme',
            switchToLight: 'Switch to light theme',
            language: 'Change language',
            darkTheme: 'Dark',
            lightTheme: 'Light',
        },
        bn: {
            home: 'হোম',
            positions: 'পজিশন',
            searchPositions: 'পজিশন খুঁজুন',
            dashboard: 'ড্যাশবোর্ড',
            profile: 'প্রোফাইল',
            login: 'লগইন',
            register: 'অ্যাকাউন্ট তৈরি করুন',
            logout: 'লগআউট',
            loading: 'লোড হচ্ছে...',
            toggleMenu: 'মেনু খুলুন বা বন্ধ করুন',
            switchToDark: 'ডার্ক থিম চালু করুন',
            switchToLight: 'লাইট থিম চালু করুন',
            language: 'ভাষা পরিবর্তন করুন',
            darkTheme: 'ডার্ক',
            lightTheme: 'লাইট',
        },
    };

    const t = translations[language] || translations.en;

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const toggleLanguage = () => {
        setLanguage((previous) => {
            const nextLanguage = previous === 'en' ? 'bn' : 'en';
            window.dispatchEvent(
                new CustomEvent('cvms-language-change', {
                    detail: nextLanguage,
                })
            );
            return nextLanguage;
        });
    };

    const handleLogout = async () => {
        try {
            await logout();
            setIsMenuOpen(false);
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error.message);
        }
    };

    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <div className="relative w-full bg-slate-50 dark:bg-slate-950 pt-6 pb-6 flex justify-center">
            {/* Floating Navbar Container */}
            <div className="w-full max-w-[1200px] mx-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] px-6 py-3 flex items-center justify-between">
                {/* Left: Logo */}
                <Link to="/" className="flex items-center gap-2.5">
                    <img
                        src={logo}
                        alt="CV Management Logo"
                        className="h-8 w-8 shrink-0 object-contain"
                    />
                    <span className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight">
                        CV Management
                    </span>
                </Link>

                {/* Center: Navigation Links (Desktop) */}
                <nav className="hidden lg:flex items-center gap-8">
                    <Link
                        to="/"
                        className="text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {t.home}
                    </Link>
                    <Link
                        to="/public/positions"
                        className="text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {t.positions}
                    </Link>
                    <Link
                        to="/public/positions?focus=search"
                        className="text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
                    >
                        <Search className="w-4 h-4" aria-hidden="true" />
                        {t.searchPositions}
                    </Link>
                </nav>

                {/* Right: Action Buttons (Desktop) */}
                <div className="hidden lg:flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        aria-label={theme === 'light' ? t.switchToDark : t.switchToLight}
                        title={theme === 'light' ? t.switchToDark : t.switchToLight}
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" aria-hidden="true" /> : <Sun className="w-4 h-4" aria-hidden="true" />}
                    </button>
                    <button
                        type="button"
                        onClick={toggleLanguage}
                        className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
                        aria-label={t.language}
                        title={t.language}
                    >
                        <Languages
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                        />

                        <span className="text-xs font-medium leading-none">
                            {language === "en" ? "EN" : "বাংলা"}
                        </span>
                    </button>

                    <div className="flex items-center gap-3 ml-2">
                        {loading ? (
                            <div className="px-4 py-1.5 text-[13px] text-slate-600 dark:text-slate-400">{t.loading}</div>
                        ) : isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="px-4 py-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    {t.dashboard}
                                </Link>
                                {profilePath && (
                                    <Link
                                        to={profilePath}
                                        className="px-4 py-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        {t.profile}
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="px-4 py-1.5 bg-[#1e293b] text-white text-[13px] font-medium rounded-md hover:bg-[#0f172a] transition-colors"
                                >
                                    {t.logout}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-1.5 bg-[#1e293b] text-white text-[13px] font-medium rounded-md hover:bg-[#0f172a] transition-colors"
                                >
                                    {t.login}
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-1.5 bg-[#2563eb] text-white text-[13px] font-medium rounded-md hover:bg-[#1d4ed8] transition-colors"
                                >
                                    {t.register}
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile: Hamburger Menu Button */}
                <button
                    type="button"
                    className="lg:hidden flex items-center justify-center p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={t.toggleMenu}
                    aria-expanded={isMenuOpen}
                    aria-controls="public-mobile-menu"
                >
                    {isMenuOpen ? (
                        <X
                            className="h-6 w-6 text-slate-600 dark:text-slate-300"
                            aria-hidden="true"
                        />
                    ) : (
                        <Menu
                            className="h-6 w-6 text-slate-600 dark:text-slate-300"
                            aria-hidden="true"
                        />
                    )}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div
                    id="public-mobile-menu"
                    className="absolute top-[88px] left-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-4 flex flex-col gap-4 lg:hidden max-w-[1200px] mx-auto"
                >
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/"
                            className="text-[15px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-1"
                            onClick={handleLinkClick}
                        >
                            {t.home}
                        </Link>
                        <Link
                            to="/public/positions"
                            className="text-[15px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-1"
                            onClick={handleLinkClick}
                        >
                            {t.positions}
                        </Link>
                        <Link
                            to="/public/positions?focus=search"
                            className="text-[15px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-1 flex items-center gap-2"
                            onClick={handleLinkClick}
                        >
                            <Search className="w-4 h-4" aria-hidden="true" />
                            {t.searchPositions}
                        </Link>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex flex-col gap-2">
                        <div className="flex items-center gap-4 px-1">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="flex items-center gap-2 text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                aria-label={theme === 'light' ? t.switchToDark : t.switchToLight}
                                title={theme === 'light' ? t.switchToDark : t.switchToLight}
                            >
                                {theme === 'light' ? <Moon className="w-4 h-4" aria-hidden="true" /> : <Sun className="w-4 h-4" aria-hidden="true" />}
                                <span>
                                    {theme === 'light'
                                        ? t.darkTheme
                                        : t.lightTheme}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={toggleLanguage}
                                className="flex items-center gap-2 text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                aria-label={t.language}
                                title={t.language}
                            >
                                <Languages className="w-4 h-4" aria-hidden="true" />
                                <span>{language === 'en' ? 'EN' : 'বাংলা'}</span>
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex flex-col gap-3">
                        {loading ? (
                            <div className="w-full text-center text-[14px] text-slate-600 dark:text-slate-400 py-2">{t.loading}</div>
                        ) : isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="w-full text-center px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    onClick={handleLinkClick}
                                >
                                    {t.dashboard}
                                </Link>
                                {profilePath && (
                                    <Link
                                        to={profilePath}
                                        className="w-full text-center px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        onClick={handleLinkClick}
                                    >
                                        {t.profile}
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleLinkClick();
                                        handleLogout();
                                    }}
                                    className="w-full text-center px-4 py-2 bg-[#1e293b] text-white text-[14px] font-medium rounded-md hover:bg-[#0f172a] transition-colors"
                                >
                                    {t.logout}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="w-full text-center px-4 py-2 bg-[#1e293b] text-white text-[14px] font-medium rounded-md hover:bg-[#0f172a] transition-colors"
                                    onClick={handleLinkClick}
                                >
                                    {t.login}
                                </Link>
                                <Link
                                    to="/register"
                                    className="w-full text-center px-4 py-2 bg-[#2563eb] text-white text-[14px] font-medium rounded-md hover:bg-[#1d4ed8] transition-colors"
                                    onClick={handleLinkClick}
                                >
                                    {t.register}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;