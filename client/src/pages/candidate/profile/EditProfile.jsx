// EditProfile.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    X,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    UserRound,
} from "lucide-react";
import api from "../../../api/axios";
import useAuth from "../../../hooks/useAuth";

const isValidHttpUrl = (value) => {
    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
};

const EditProfile = () => {
    const navigate = useNavigate();
    const { refreshAuth } = useAuth();

    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        location: "",
        profilePhoto: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [imagePreviewError, setImagePreviewError] = useState(false);
    const [retryCounter, setRetryCounter] = useState(0);

    useEffect(() => {
        let cancelled = false;

        api.get("/profile")
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;

                if (!data) {
                    setProfile(null);
                    setError("Profile not found.");
                    return;
                }

                setProfile(data);
                setFormData({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    location: data.location || "",
                    profilePhoto: data.profilePhoto || "",
                });
                setImagePreviewError(false);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setProfile(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load profile. Please try again."
                );
                console.error(
                    "Failed to fetch Candidate Profile:",
                    requestError.message
                );
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [retryCounter]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((previous) => previous + 1);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (validationErrors[name]) {
            setValidationErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }

        if (successMessage) {
            setSuccessMessage("");
        }

        if (name === "profilePhoto") {
            setImagePreviewError(false);
        }
    };

    const validateForm = () => {
        const errors = {};

        const firstNameTrim = formData.firstName.trim();
        const lastNameTrim = formData.lastName.trim();

        if (!firstNameTrim) {
            errors.firstName = "First name is required.";
        }

        if (!lastNameTrim) {
            errors.lastName = "Last name is required.";
        }

        const profilePhotoTrim = formData.profilePhoto.trim();

        if (profilePhotoTrim && !isValidHttpUrl(profilePhotoTrim)) {
            errors.profilePhoto = "Enter a valid http or https image URL.";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccessMessage("");

            const payload = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                location: formData.location.trim() || null,
                profilePhoto: formData.profilePhoto.trim() || null,
            };

            const response = await api.patch("/profile", payload);
            const updatedProfile = response.data?.data;

            if (!updatedProfile) {
                throw new Error("Profile update returned no data.");
            }

            setProfile(updatedProfile);
            setFormData({
                firstName: updatedProfile.firstName || "",
                lastName: updatedProfile.lastName || "",
                location: updatedProfile.location || "",
                profilePhoto: updatedProfile.profilePhoto || "",
            });

            await refreshAuth();
            setSuccessMessage("Profile updated successfully.");
            setImagePreviewError(false);

            // Navigate back to profile after successful update
            navigate("/profile");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to update profile. Please try again."
            );
            console.error(
                "Failed to update candidate profile:",
                requestError.message
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading profile...
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Profile
                    </Link>
                </div>

                <div
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6"
                    role="alert"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
                                Error loading profile
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {error}
                            </p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                            >
                                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Profile
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                        <UserRound className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        Profile not found
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        We couldn't find your profile information.
                    </p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const formatRole = (role) => {
        if (!role) return "N/A";
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const formattedRole = formatRole(profile.role);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Profile
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Edit Profile
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Update your personal information used across your profile and CVs.
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div
                    className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3"
                    role="status"
                >
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                            {successMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* Page Error */}
            {error && (
                <div
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                    role="alert"
                >
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* Edit Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                        <label
                            htmlFor="firstName"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={saving}
                            aria-invalid={Boolean(validationErrors.firstName)}
                            aria-describedby={
                                validationErrors.firstName
                                    ? "firstName-error"
                                    : undefined
                            }
                            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${validationErrors.firstName
                                ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                                }`}
                        />
                        {validationErrors.firstName && (
                            <p
                                id="firstName-error"
                                className="mt-1 text-sm text-red-600 dark:text-red-400"
                            >
                                {validationErrors.firstName}
                            </p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div>
                        <label
                            htmlFor="lastName"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={saving}
                            aria-invalid={Boolean(validationErrors.lastName)}
                            aria-describedby={
                                validationErrors.lastName
                                    ? "lastName-error"
                                    : undefined
                            }
                            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${validationErrors.lastName
                                ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                                }`}
                        />
                        {validationErrors.lastName && (
                            <p
                                id="lastName-error"
                                className="mt-1 text-sm text-red-600 dark:text-red-400"
                            >
                                {validationErrors.lastName}
                            </p>
                        )}
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={profile.email || ""}
                            disabled
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Email cannot be changed.
                        </p>
                    </div>

                    {/* Location */}
                    <div>
                        <label
                            htmlFor="location"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Location
                        </label>
                        <input
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleChange}
                            disabled={saving}
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="City, Country"
                        />
                    </div>

                    {/* Profile Photo URL */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="profilePhoto"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Profile Photo URL
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    id="profilePhoto"
                                    name="profilePhoto"
                                    type="url"
                                    value={formData.profilePhoto}
                                    onChange={handleChange}
                                    disabled={saving}
                                    aria-invalid={Boolean(validationErrors.profilePhoto)}
                                    aria-describedby={
                                        validationErrors.profilePhoto
                                            ? "profilePhoto-error"
                                            : undefined
                                    }
                                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${validationErrors.profilePhoto
                                        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                                        }`}
                                    placeholder="Enter an external image URL"
                                />
                                {validationErrors.profilePhoto && (
                                    <p
                                        id="profilePhoto-error"
                                        className="mt-1 text-sm text-red-600 dark:text-red-400"
                                    >
                                        {validationErrors.profilePhoto}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Enter an externally hosted image URL.
                                </p>
                            </div>
                            {formData.profilePhoto && (
                                <div className="shrink-0 flex items-start">
                                    {!imagePreviewError ? (
                                        <img
                                            src={formData.profilePhoto}
                                            alt="Profile preview"
                                            className="h-12 w-12 flex-shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                            onError={() => setImagePreviewError(true)}
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                            <ImageIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                        <label
                            htmlFor="role"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Role
                        </label>
                        <input
                            id="role"
                            type="text"
                            value={formattedRole}
                            disabled
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Role cannot be changed.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" aria-hidden="true" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;