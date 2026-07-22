import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';


const Register = () => {
    const navigate = useNavigate();
    const { refreshAuth } = useAuth();

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI states
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // New states for the design
    const [role, setRole] = useState('CANDIDATE');
    const [acceptTerms, setAcceptTerms] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!acceptTerms) {
            setError('You must agree to the Terms and Privacy Policy');
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/register", {
                firstName,
                lastName,
                email,
                password,
                role
            });

            await refreshAuth();

            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            {/* Desktop: Two-column layout */}
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row">

                {/* LEFT SECTION - Hidden on mobile/tablet, visible on lg and up */}
                <div className="hidden sm:flex lg:w-1/2 p-10 flex-col bg-white border-r border-slate-100">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="bg-blue-600 text-white rounded p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5M10.5 21v-7.5M3 13.5h18M4.5 13.5V6a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0119.5 6v7.5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-slate-800">Resumate</span>
                    </div>

                    {/* Headline & Description */}
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">
                        Start Building Better CVs Today
                    </h1>
                    <p className="text-slate-500 text-lg mb-8">
                        Join a modern platform to manage your career and connect with opportunities.
                    </p>

                    {/* Features Preview */}
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-slate-700 mb-3">Features Preview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                                <div className="flex items-start gap-2">
                                    <div className="text-slate-600 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-800">Profile Management</h4>
                                        <p className="text-xs text-slate-500 leading-tight">Maintain a master profile and skills library.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                                <div className="flex items-start gap-2">
                                    <div className="text-slate-600 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-800">Position-Based CV</h4>
                                        <p className="text-xs text-slate-500 leading-tight">Automate CVs targeted to specific job roles.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                                <div className="flex items-start gap-2">
                                    <div className="text-slate-600 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225.012.449.037.669m29.5 0a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225.012.449.037.669m-1.8 0a9.094 9.094 0 01-3.741-.479 3 3 0 004.682-2.72m-1.78 3.198l.001.031c0 .225-.012.449-.037.669m-4.68-2.72A3 3 0 0015 17.25v6a3 3 0 003 3h6a3 3 0 003-3v-6a3 3 0 00-3-3h-6z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-800">Recruiter Collab</h4>
                                        <p className="text-xs text-slate-500 leading-tight">Connect directly with hiring teams.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                                <div className="flex items-start gap-2">
                                    <div className="text-slate-600 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-800">Project Portfolio</h4>
                                        <p className="text-xs text-slate-500 leading-tight">Showcase your real-world projects.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Completion Preview */}
                    <div className="border-t border-slate-200 pt-6 mt-auto">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-slate-700">Profile Completion</h3>
                            <span className="text-sm font-semibold text-slate-700">5%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '5%' }}></div>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-500 mb-4">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Task task</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Verify email</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>Recruiter</span>
                        </div>
                        <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 flex items-center gap-4">
                            <div className="w-16 h-10 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                                Mockup
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Illustrative product mockup</p>
                                <p className="text-xs text-slate-500">Resumate's modern platform to manage your career</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SECTION - Registration Form (Directly integrated) */}
                <div className="w-full lg:w-1/2 p-4 md:p-12 flex flex-col bg-white">

                    {/* Form Header - Updated title and added subtitle */}
                    <div className="mb-6 lg:mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">Create Account</h2>
                        <p className="text-slate-500 text-center text-base">
                            Create your account to start building tailored CVs.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="First Name"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="Last Name"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="Email"
                                disabled={loading}
                            />
                        </div>

                        {/* Password Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10"
                                        placeholder="Password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10"
                                        placeholder="Confirm"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                    >
                                        {showConfirmPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Role Selection
                            </label>
                            <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setRole('CANDIDATE')}
                                    className={`flex-1 py-2.5 text-sm font-medium transition ${role === 'CANDIDATE'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Candidate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('RECRUITER')}
                                    className={`flex-1 py-2.5 text-sm font-medium transition ${role === 'RECRUITER'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Recruiter
                                </button>
                            </div>
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start gap-2">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                disabled={loading}
                            />
                            <label htmlFor="terms" className="text-sm text-slate-600">
                                I agree to <span className="text-blue-600 hover:underline cursor-pointer">Terms</span> and <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                            </label>
                        </div>

                        {/* Create Account Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>

                        {/* Continue with Google */}
                        <button
                            type="button"
                            className="w-full py-3 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition duration-200 flex items-center justify-center gap-2"
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

                        {/* Footer */}
                        <div className="text-center mt-4">
                            <p className="text-sm text-slate-600">
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;