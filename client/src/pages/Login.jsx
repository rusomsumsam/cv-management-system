import  { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';


const Login = () => {
    const navigate = useNavigate();
    const { refreshAuth } = useAuth();

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // UI states
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/login', {
                email,
                password,
            });

            await refreshAuth();
            navigate('/dashboard');

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Invalid credentials. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row">

            {/* LEFT SIDE - Information Panel */}
            <div className="w-full lg:w-1/2 bg-white p-8 lg:p-16 hidden sm:flex flex-col justify-center lg:min-h-screen border-r border-slate-100">

                {/* Product Label */}
                <div className="mb-4">
                    <span className="inline-block text-[13px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                        Resumate
                    </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-[40px] lg:text-[52px] font-extrabold text-[#0f172a] leading-[1.1] tracking-tight mb-4 max-w-lg">
                    Build One Profile.<br />
                    Generate Unlimited Position-Specific CVs.
                </h1>

                {/* Subheading */}
                <p className="text-[17px] text-[#475569] leading-relaxed mb-10 max-w-md">
                    Automate targeted applications and manage your entire application lifecycle from a single master profile.
                </p>

                {/* Workflow Illustration / Mockup Area */}
                <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-6 max-w-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                            <div className="flex justify-center mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563eb" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                            <p className="text-[12px] font-semibold text-[#0f172a]">Profile</p>
                        </div>

                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#94a3b8" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>

                        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                            <div className="flex justify-center mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563eb" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.603V7.15m-16.5 7v-4.25M20.25 7.15c0-.976-.644-1.796-1.56-2.058-2.442-.7-5.103-1.005-7.69-1.005s-5.248.305-7.69 1.005c-.916.262-1.56 1.082-1.56 2.058m16.5 0v4.25m-16.5-4.25v4.25" />
                                </svg>
                            </div>
                            <p className="text-[12px] font-semibold text-[#0f172a]">Position</p>
                        </div>

                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#94a3b8" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>

                        <div className="flex-1 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3 text-center shadow-sm">
                            <div className="flex justify-center mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563eb" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <p className="text-[12px] font-bold text-[#2563eb]">CV Gen</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-[13px] text-[#64748b] font-medium justify-center">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Build profile
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Match position
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Generate CV
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Login Card */}
            <div className="w-full lg:w-1/2 bg-[#f8fafc] p-6 lg:p-12 flex items-center justify-center min-h-[70vh] lg:min-h-screen">
                <div className="w-full max-w-[420px] bg-white rounded-xl border border-slate-200 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] p-8">

                    {/* Card Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-[28px] font-bold text-[#0f172a] mb-1.5">Welcome Back</h2>
                        <p className="text-[15px] text-[#64748b]">Continue your CV journey</p>
                    </div>

                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[14px] font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-[14px] font-medium text-[#0f172a] mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white placeholder:text-slate-400 text-[15px]"
                                placeholder="Enter your email"
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-[14px] font-medium text-[#0f172a] mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white placeholder:text-slate-400 text-[15px] pr-10"
                                    placeholder="Enter your password"
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-[14px] text-[#475569] font-medium">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-[14px] font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-semibold text-[15px] rounded-lg transition-all duration-200 shadow-[0_1px_2px_rgba(37,99,235,0.3)] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-[13px] text-[#94a3b8] font-medium">or</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        {/* Continue with Google */}
                        <button
                            type="button"
                            className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-[#0f172a] font-medium text-[15px] hover:bg-slate-50 transition duration-200 flex items-center justify-center gap-2.5 bg-white shadow-sm"
                            disabled={loading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Footer Link */}
                        <div className="text-center mt-2">
                            <p className="text-[15px] text-[#475569]">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="text-[#2563eb] hover:text-[#1d4ed8] font-semibold hover:underline transition-colors"
                                >
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;