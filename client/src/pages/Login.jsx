// client/src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

const OAUTH_ERROR_MESSAGES = {
    oauth_cancelled: 'Social sign-in was cancelled.',
    oauth_state_invalid: 'The social sign-in request expired or was invalid. Please try again.',
    oauth_configuration: 'Social sign-in is temporarily unavailable.',
    oauth_provider_error: 'The authentication provider could not complete sign-in. Please try again.',
    oauth_email_unavailable: 'A verified email address is required to sign in.',
    oauth_email_unverified: 'Your provider email address must be verified before signing in.',
    oauth_account_conflict: 'This social account cannot be linked to the existing account.',
    oauth_login_failed: 'Social sign-in failed. Please try again.',
};

const getOAuthUrl = (provider) => {
    const apiBaseUrl = import.meta.env.VITE_API_URL;
    if (typeof apiBaseUrl !== 'string' || !apiBaseUrl.trim()) {
        throw new Error('Authentication service is not configured.');
    }
    let parsedUrl;
    try {
        parsedUrl = new URL(apiBaseUrl.trim());
    } catch {
        throw new Error('Authentication service is not configured.');
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Authentication service is not configured.');
    }
    const normalizedBase = parsedUrl.toString().replace(/\/+$/, '');
    return `${normalizedBase}/auth/${provider}`;
};

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { refreshAuth } = useAuth();

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // UI states
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [socialLoading, setSocialLoading] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || socialLoading) {
            return;
        }
        setError('');

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Validation
        if (!normalizedEmail) {
            setError('Email is required.');
            return;
        }
        if (normalizedEmail.length > 254) {
            setError('Email cannot exceed 254 characters.');
            return;
        }
        const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!password) {
            setError('Password is required.');
            return;
        }
        if (password.length > 72) {
            setError('Password cannot exceed 72 characters.');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/login', {
                email: normalizedEmail,
                password,
            });

            await refreshAuth();

            // Safely determine destination
            const from = location.state?.from?.pathname;
            let destination = '/dashboard';

            if (
                typeof from === 'string' &&
                from.startsWith('/') &&
                !from.startsWith('//') &&
                from !== '/login' &&
                from !== '/register'
            ) {
                destination = from;
            }

            navigate(destination, { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Invalid credentials. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        if (loading || socialLoading) {
            return;
        }
        if (provider !== 'google' && provider !== 'github') {
            setError('Unsupported authentication provider.');
            return;
        }
        try {
            setError('');
            setSocialLoading(provider);
            const oauthUrl = getOAuthUrl(provider);
            window.location.assign(oauthUrl);
        } catch (oauthError) {
            setSocialLoading('');
            setError(
                oauthError.message ||
                'Social authentication is temporarily unavailable.'
            );
        }
    };

    const oauthErrorCode = searchParams.get('oauthError');
    const oauthErrorMessage =
        typeof oauthErrorCode === 'string'
            ? OAUTH_ERROR_MESSAGES[oauthErrorCode] || ''
            : '';
    const displayedError = error || oauthErrorMessage;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col lg:flex-row">

                {/* LEFT SECTION - Hidden on mobile/tablet, visible on lg and up */}
                <div className="hidden sm:flex lg:w-1/2 p-10 flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="bg-blue-600 text-white rounded p-1">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5M10.5 21v-7.5M3 13.5h18M4.5 13.5V6a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0119.5 6v7.5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-white">Resumate</span>
                    </div>

                    {/* Headline & Description */}
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        Welcome Back to Resumate
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
                        Continue managing your reusable Profile and generating Position-specific CVs.
                    </p>

                    {/* Features Preview */}
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Features Preview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-start gap-2">
                                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Profile Management</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Maintain your reusable Candidate Profile.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-start gap-2">
                                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Position Matching</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Explore suitable public Positions.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-start gap-2">
                                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225.012.449.037.669m29.5 0a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225.012.449.037.669m-1.8 0a9.094 9.094 0 01-3.741-.479 3 3 0 004.682-2.72m-1.78 3.198l.001.031c0 .225-.012.449-.037.669m-4.68-2.72A3 3 0 0015 17.25v6a3 3 0 003 3h6a3 3 0 003-3v-6a3 3 0 00-3-3h-6z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Tailored CVs</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Generate Position-specific CVs.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-start gap-2">
                                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-4 h-4"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Project Portfolio</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Manage and reuse your project history.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Preview */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-auto">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center shadow-sm">
                                <div className="flex justify-center mb-0.5">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="#2563eb"
                                        className="w-4 h-4"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Profile</p>
                            </div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="#94a3b8"
                                className="w-4 h-4"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center shadow-sm">
                                <div className="flex justify-center mb-0.5">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="#2563eb"
                                        className="w-4 h-4"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.603V7.15m-16.5 7v-4.25M20.25 7.15c0-.976-.644-1.796-1.56-2.058-2.442-.7-5.103-1.005-7.69-1.005s-5.248.305-7.69 1.005c-.916.262-1.56 1.082-1.56 2.058m16.5 0v4.25m-16.5-4.25v4.25" />
                                    </svg>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Position</p>
                            </div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="#94a3b8"
                                className="w-4 h-4"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                            <div className="flex-1 bg-[#eff6ff] dark:bg-[#1e3a5f] border border-[#bfdbfe] dark:border-[#1e4a7a] rounded-lg p-2 text-center shadow-sm">
                                <div className="flex justify-center mb-0.5">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="#2563eb"
                                        className="w-4 h-4"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                </div>
                                <p className="text-[11px] font-bold text-[#2563eb] dark:text-[#60a5fa]">CV Gen</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-[12px] text-[#64748b] dark:text-slate-400 font-medium justify-center">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Build Profile
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Match Position
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Generate CV
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT SECTION - Login Form */}
                <div className="w-full lg:w-1/2 p-4 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
                    <div className="max-w-lg w-full mx-auto">
                        {/* Form Header */}
                        <div className="mb-6 lg:mb-8 text-center">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-base">
                                Sign in to continue your CV journey.
                            </p>
                        </div>

                        {displayedError && (
                            <div id="login-error" role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                {displayedError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={displayedError ? "login-error" : undefined}>
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    placeholder="Email"
                                    disabled={loading || Boolean(socialLoading)}
                                    autoComplete="email"
                                    required
                                    maxLength={254}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-10"
                                        placeholder="Password"
                                        disabled={loading || Boolean(socialLoading)}
                                        autoComplete="current-password"
                                        required
                                        maxLength={72}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                        disabled={loading || Boolean(socialLoading)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading || Boolean(socialLoading)}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="animate-spin h-5 w-5 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : (
                                    'Login'
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative flex items-center my-1">
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
                                <span className="flex-shrink-0 mx-4 text-[13px] text-[#94a3b8] dark:text-slate-500 font-medium">or continue with</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
                            </div>

                            {/* Social Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Google Button */}
                                <button
                                    type="button"
                                    onClick={() => handleSocialLogin('google')}
                                    disabled={loading || Boolean(socialLoading)}
                                    aria-label="Continue with Google"
                                    title="Continue with Google"
                                    aria-busy={socialLoading === 'google'}
                                    className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-100 font-medium text-[15px] hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 48 48"
                                        className="w-5 h-5"
                                        aria-hidden="true"
                                    >
                                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                    </svg>
                                    {socialLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                                </button>

                                {/* GitHub Button */}
                                <button
                                    type="button"
                                    onClick={() => handleSocialLogin('github')}
                                    disabled={loading || Boolean(socialLoading)}
                                    aria-label="Continue with GitHub"
                                    title="Continue with GitHub"
                                    aria-busy={socialLoading === 'github'}
                                    className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-[15px] hover:bg-slate-800 dark:hover:bg-white transition duration-200 rounded-lg flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                        aria-hidden="true"
                                    >
                                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.455-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.071 1.531 1.031 1.531 1.031.892 1.529 2.341 1.087 2.91.831.091-.647.349-1.087.635-1.337-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.295 2.748-1.026 2.748-1.026.546 1.377.203 2.394.1 2.647.64.7 1.028 1.595 1.028 2.688 0 3.848-2.337 4.695-4.566 4.943.359.31.678.921.678 1.856 0 1.34-.012 2.421-.012 2.75 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z" />
                                    </svg>
                                    {socialLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
                                </button>
                            </div>

                            {/* Footer Link */}
                            <div className="text-center mt-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Don't have an account?{' '}
                                    <Link
                                        to="/register"
                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                    >
                                        Create Account
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;