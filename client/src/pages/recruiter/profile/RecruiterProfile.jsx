import { useState, useEffect } from "react";
import api from "../../../api/axios";
import useAuth from "../../../hooks/useAuth";
import {
    UserRound,
    Mail,
    MapPin,
    BriefcaseBusiness,
    CalendarDays,
    Clock,
    Pencil,
    Save,
    X,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

const RecruiterProfile = () => {
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
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [imagePreviewError, setImagePreviewError] = useState(false);

    const getFullName = () => {
        const firstName = profile?.firstName;
        const lastName = profile?.lastName;

        if (firstName || lastName) {
            return [firstName, lastName].filter(Boolean).join(" ");
        }

        if (profile?.email) {
            return profile.email;
        }

        return "User";
    };

    const getInitials = () => {
        const firstName = profile?.firstName;
        const lastName = profile?.lastName;

        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }

        if (firstName) {
            return firstName.charAt(0).toUpperCase();
        }

        if (lastName) {
            return lastName.charAt(0).toUpperCase();
        }

        if (profile?.email) {
            return profile.email.charAt(0).toUpperCase();
        }

        return "U";
    };

    const formatRole = (role) => {
        if (!role) return "";
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const formatDate = (dateString) => {
        if (!dateString) {
            return "N/A";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "N/A";
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const fetchProfile = async (showLoader = false) => {
        if (showLoader) {
            setLoading(true);
        }

        try {
            setError("");

            const response = await api.get("/profile");
            const data = response.data.data;

            setProfile(data);
            setFormData({
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                location: data.location || "",
                profilePhoto: data.profilePhoto || "",
            });
            setImagePreviewError(false);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load profile. Please try again."
            );
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadProfile = async () => {
            await fetchProfile();
        };

        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }

        // Clear success message when user starts editing
        if (successMessage) {
            setSuccessMessage("");
        }

        // Reset image preview error when URL changes
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

        if (profilePhotoTrim) {
            const isValidUrl = /^https?:\/\//i.test(profilePhotoTrim);

            if (!isValidUrl) {
                errors.profilePhoto = "Enter a valid http or https image URL.";
            }
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
            const updatedProfile = response.data.data;

            setProfile(updatedProfile);
            setFormData({
                firstName: updatedProfile.firstName || "",
                lastName: updatedProfile.lastName || "",
                location: updatedProfile.location || "",
                profilePhoto: updatedProfile.profilePhoto || "",
            });

            await refreshAuth();
            setIsEditing(false);
            setSuccessMessage("Profile updated successfully.");
            setImagePreviewError(false);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update profile. Please try again."
            );
            console.error("Error updating profile:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setValidationErrors({});
        setError("");
        setSuccessMessage("");
    };

    const handleCancel = () => {
        setFormData({
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            location: profile?.location || "",
            profilePhoto: profile?.profilePhoto || "",
        });
        setValidationErrors({});
        setError("");
        setSuccessMessage("");
        setIsEditing(false);
        setImagePreviewError(false);
    };

    const handleRetry = () => {
        fetchProfile(true);
    };

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                        Loading profile...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Recruiter Profile
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        View and manage your personal account information.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
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
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
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
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Recruiter Profile
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        View and manage your personal account information.
                    </p>
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
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const fullName = getFullName();
    const initials = getInitials();
    const formattedRole = formatRole(profile.role);
    const hasProfilePhoto = Boolean(profile.profilePhoto);

    const memberSince = formatDate(profile.createdAt);
    const lastUpdated = formatDate(profile.updatedAt);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Recruiter Profile
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        View and manage your personal account information.
                    </p>
                </div>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={handleEdit}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit Profile
                    </button>
                )}
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

            {/* Profile Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex-shrink-0">
                        {hasProfilePhoto && !isEditing ? (
                            <img
                                src={profile.profilePhoto}
                                alt={fullName}
                                className="h-20 w-20 flex-shrink-0 rounded-full border-2 border-slate-200 object-cover dark:border-slate-700"
                            />
                        ) : (
                            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-xl font-semibold text-blue-600 dark:text-blue-400">
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                            {fullName}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" aria-hidden="true" />
                                <span>{profile.email}</span>
                            </div>
                            {profile.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" aria-hidden="true" />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                                <span>{formattedRole}</span>
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" aria-hidden="true" />
                                <span>Member since {memberSince}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                <span>Last updated {lastUpdated}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Details / Edit Form */}
            {isEditing ? (
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
                                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.firstName
                                        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                                    }`}
                            />
                            {validationErrors.firstName && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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
                                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.lastName
                                        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                                    }`}
                            />
                            {validationErrors.lastName && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.profilePhoto
                                                ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
                                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                                            }`}
                                        placeholder="Enter an external image URL"
                                    />
                                    {validationErrors.profilePhoto && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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
                            onClick={handleCancel}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            ) : (
                /* View Mode Details */
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        Personal Information
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                First Name
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                                {profile.firstName || "N/A"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Last Name
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                                {profile.lastName || "N/A"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Email
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                                {profile.email || "N/A"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Location
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                                {profile.location || "N/A"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Role
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                                {formattedRole}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Member Since
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                                {memberSince}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
        </div>
    );
};

export default RecruiterProfile;