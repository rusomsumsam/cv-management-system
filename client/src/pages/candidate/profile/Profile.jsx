import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Mail,
    MapPin,
    BriefcaseBusiness,
    FolderKanban,
    FileText,
    Award,
    Heart,
    AlertCircle,
    RefreshCw,
    UserRound,
} from "lucide-react";
import api from "../../../api/axios";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [profileImageError, setProfileImageError] = useState(false);

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
                setProfileImageError(false);
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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "N/A";

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatRole = (role) => {
        if (!role) return "N/A";
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const formatAttributeType = (type) => {
        if (!type) return "N/A";
        return type
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase());
    };

    const formatAttributeValue = (value) => {
        if (value === null || value === undefined) return "Not provided";
        if (typeof value === "string" && value.trim() === "") return "Not provided";
        return String(value);
    };

    const formatStatus = (status) => {
        if (status === "PUBLISHED") return "Published";
        return "Draft";
    };

    const getStatusColor = (status) => {
        if (status === "PUBLISHED") {
            return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
        }
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
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
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        My Profile
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage your personal information, attributes, projects, and CVs.
                    </p>
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
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        My Profile
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage your personal information, attributes, projects, and CVs.
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
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const userAttributes = Array.isArray(profile.userAttributes) ? profile.userAttributes : [];
    const projects = Array.isArray(profile.projects) ? profile.projects : [];
    const cvs = Array.isArray(profile.cvs) ? profile.cvs : [];

    const fullName = [profile.firstName, profile.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "Name not provided";

    const initials = [
        profile.firstName?.charAt(0) || "",
        profile.lastName?.charAt(0) || ""
    ]
        .filter(Boolean)
        .join("")
        .toUpperCase() || "U";

    const hasProfilePhoto = Boolean(profile.profilePhoto);
    const formattedRole = formatRole(profile.role);
    const memberSince = formatDate(profile.createdAt);
    const lastUpdated = formatDate(profile.updatedAt);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        My Profile
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage your personal information, attributes, projects, and CVs.
                    </p>
                </div>
                <Link
                    to="/profile/edit"
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                >
                    Edit Profile
                </Link>
            </div>

            {/* SECTION 1: ME */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex-shrink-0">
                        {hasProfilePhoto && !profileImageError ? (
                            <img
                                src={profile.profilePhoto}
                                alt={fullName}
                                className="h-20 w-20 flex-shrink-0 rounded-full border-2 border-slate-200 object-cover dark:border-slate-700"
                                onError={() => setProfileImageError(true)}
                            />
                        ) : (
                            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-xl font-semibold text-blue-600 dark:text-blue-400">
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                            {fullName}
                        </h2>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                <span>{profile.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                <span>{profile.location || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BriefcaseBusiness className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                <span>{formattedRole}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>Member since {memberSince}</span>
                            <span>Last updated {lastUpdated}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: INFO */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Info</h2>
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                            Profile Attributes
                        </span>
                    </div>
                    <Link
                        to="/profile/attributes"
                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                    >
                        Manage Attributes
                    </Link>
                </div>

                {userAttributes.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Attribute
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Value
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {userAttributes.map((attr) => (
                                    <tr key={attr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                                            <Link
                                                to={`/profile/attributes/${attr.id}`}
                                                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                            >
                                                {attr.attribute?.name || "N/A"}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                            {attr.attribute?.category || "N/A"}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                            {formatAttributeType(attr.attribute?.type)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                            {formatAttributeValue(attr.value)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                            {formatDate(attr.updatedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No attributes added yet
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Add attributes from the library to complete your reusable profile.
                        </p>
                        <Link
                            to="/profile/attributes"
                            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                        >
                            Manage Attributes
                        </Link>
                    </div>
                )}
            </div>

            {/* SECTION 3: PROJECTS */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5 text-blue-600" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Projects</h2>
                    </div>
                    <Link
                        to="/projects"
                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                    >
                        Manage Projects
                    </Link>
                </div>

                {projects.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Project
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                                            <Link
                                                to={`/projects/${project.id}`}
                                                className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                            >
                                                {project.title || "N/A"}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300 max-w-md truncate">
                                            {project.description || "No description provided."}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                            {formatDate(project.createdAt)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                            {formatDate(project.updatedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No projects added yet
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Add projects to showcase your work in generated CVs.
                        </p>
                        <Link
                            to="/projects"
                            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                        >
                            Manage Projects
                        </Link>
                    </div>
                )}
            </div>

            {/* SECTION 4: CVS */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">CVs</h2>
                    </div>
                    <Link
                        to="/my-cvs"
                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                    >
                        View All CVs
                    </Link>
                </div>

                {cvs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        CV
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Updated
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Likes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {cvs.map((cv) => {
                                    const likesCount = cv._count?.likes ?? 0;
                                    return (
                                        <tr key={cv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                                                <Link
                                                    to={`/cvs/${cv.id}`}
                                                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                                >
                                                    {cv.fullName || fullName}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                                {cv.position?.title || "N/A"}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        cv.status
                                                    )}`}
                                                >
                                                    {formatStatus(cv.status)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                                {formatDate(cv.createdAt)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                                {formatDate(cv.updatedAt)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Heart className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                                                    <span>{likesCount}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No CVs created yet
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Create a CV from an available position.
                        </p>
                        <Link
                            to="/candidate/positions"
                            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                        >
                            Browse Available Positions
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;