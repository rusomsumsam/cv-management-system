import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios'; // Adjust path to your axios instance

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await api.get('/auth/me');
                setIsAuthenticated(true);
            } catch (err) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    // Handle logout
    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            setIsAuthenticated(false);
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    // Close mobile menu when navigating
    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <div className="w-full bg-[#f8fafc] pt-6 pb-6 flex justify-center">
            {/* Floating Navbar Container */}
            <div className="w-full max-w-[1200px] mx-4 bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] px-6 py-3 flex items-center justify-between">

                {/* Left: Logo */}
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="bg-[#2563eb] text-white rounded-md p-1.5 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <span className="text-[17px] font-semibold text-[#0f172a] tracking-tight">Resumate</span>
                </Link>

                {/* Center: Navigation Links (Desktop) */}
                <nav className="hidden lg:flex items-center gap-8">
                    <Link
                        to="/features"
                        className="text-[14px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors"
                    >
                        Features
                    </Link>
                    <Link
                        to="/positions"
                        className="text-[14px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors"
                    >
                        Positions
                    </Link>
                    <Link
                        to="/cv-builder"
                        className="text-[14px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors"
                    >
                        CV Builder
                    </Link>
                    <Link
                        to="/about"
                        className="text-[14px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors"
                    >
                        About
                    </Link>
                </nav>

                {/* Right: Action Buttons (Desktop) */}
                <div className="hidden lg:flex items-center gap-3">
                    {loading ? (
                        <div className="px-4 py-1.5 text-[13px] text-slate-400">Loading...</div>
                    ) : isAuthenticated ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="px-4 py-1.5 text-[13px] font-medium text-[#0f172a] hover:text-[#2563eb] transition-colors"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/profile"
                                className="px-4 py-1.5 text-[13px] font-medium text-[#0f172a] hover:text-[#2563eb] transition-colors"
                            >
                                Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-1.5 bg-[#1e293b] text-white text-[13px] font-medium rounded-md hover:bg-[#0f172a] transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-4 py-1.5 bg-[#1e293b] text-white text-[13px] font-medium rounded-md hover:bg-[#0f172a] transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-1.5 bg-[#2563eb] text-white text-[13px] font-medium rounded-md hover:bg-[#1d4ed8] transition-colors"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile: Hamburger Menu Button */}
                <button
                    className="lg:hidden flex items-center justify-center p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="absolute top-[88px] left-4 right-4 z-50 bg-white rounded-xl border border-slate-200 shadow-lg p-4 flex flex-col gap-4 lg:hidden max-w-[1200px] mx-auto">
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/features"
                            className="text-[15px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors px-1"
                            onClick={handleLinkClick}
                        >
                            Features
                        </Link>
                        <Link
                            to="/positions"
                            className="text-[15px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors px-1"
                            onClick={handleLinkClick}
                        >
                            Positions
                        </Link>
                        <Link
                            to="/cv-builder"
                            className="text-[15px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors px-1"
                            onClick={handleLinkClick}
                        >
                            CV Builder
                        </Link>
                        <Link
                            to="/about"
                            className="text-[15px] font-medium text-[#475569] hover:text-[#0f172a] transition-colors px-1"
                            onClick={handleLinkClick}
                        >
                            About
                        </Link>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex flex-col gap-3">
                        {loading ? (
                            <div className="w-full text-center text-[14px] text-slate-400 py-2">Loading...</div>
                        ) : isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="w-full text-center px-4 py-2 text-[14px] font-medium text-[#0f172a] hover:text-[#2563eb] transition-colors"
                                    onClick={handleLinkClick}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/profile"
                                    className="w-full text-center px-4 py-2 text-[14px] font-medium text-[#0f172a] hover:text-[#2563eb] transition-colors"
                                    onClick={handleLinkClick}
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLinkClick();
                                        handleLogout();
                                    }}
                                    className="w-full text-center px-4 py-2 bg-[#1e293b] text-white text-[14px] font-medium rounded-md hover:bg-[#0f172a] transition-colors"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="w-full text-center px-4 py-2 bg-[#1e293b] text-white text-[14px] font-medium rounded-md hover:bg-[#0f172a] transition-colors"
                                    onClick={handleLinkClick}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="w-full text-center px-4 py-2 bg-[#2563eb] text-white text-[14px] font-medium rounded-md hover:bg-[#1d4ed8] transition-colors"
                                    onClick={handleLinkClick}
                                >
                                    Get Started
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