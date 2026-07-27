// client/src/pages/candidate/cvs/EditCV.jsx
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    AlertCircle,
    RefreshCw,
    CheckCircle2,
    Clock,
    FolderKanban,
    Info,
    ListChecks
} from "lucide-react";
import api from "../../../api/axios";

const isMissingValue = (value) => {
    return (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
    );
};

const isAttributeMissing = (attribute) => {
    if (typeof attribute?.isMissing === "boolean") {
        return attribute.isMissing;
    }
    return isMissingValue(attribute?.value);
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
};

const formatStatus = (status) => {
    if (status === "PUBLISHED") return "Published";
    if (status === "DRAFT") return "Draft";
    return "Unknown";
};

const formatAttributeValueForDisplay = (attribute) => {
    if (isAttributeMissing(attribute)) {
        return (
            <span className="inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Missing information
            </span>
        );
    }

    if (attribute?.type === "BOOLEAN") {
        const isTrue = attribute.value === true || attribute.value === "true";
        return (
            <span className="text-slate-900 dark:text-white">
                {isTrue ? "Yes" : "No"}
            </span>
        );
    }

    return (
        <span className="break-words text-slate-900 dark:text-white">
            {String(attribute?.value)}
        </span>
    );
};

const EditCV = () => {
    const { id } = useParams();

    const [cv, setCv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);

    useEffect(() => {
        let cancelled = false;

        api
            .get(`/cvs/${id}`)
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;
                if (!data) {
                    setCv(null);
                    setError("CV not found.");
                    return;
                }

                setCv(data);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;
                setCv(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load CV details. Please try again."
                );
                console.error("Failed to load CV details for editing:", requestError.message);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id, retryCounter]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((previous) => previous + 1);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-[320px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span className="text-sm font-medium">Loading CV...</span>
                </div>
            </div>
        );
    }

    // Load error state
    if (error && !cv) {
        return (
            <div className="space-y-6" role="alert">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Link
                        to="/my-cvs"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to My CVs
                    </Link>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit CV</h2>
                            <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{error}</p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                            >
                                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Not found state
    if (!cv) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Link
                        to="/my-cvs"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to My CVs
                    </Link>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">CV not found</h2>
                    <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">
                        The CV you are looking for does not exist or you do not have permission to edit it.
                    </p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const attributes = Array.isArray(cv.attributes) ? cv.attributes : [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Link
                    to={`/cvs/${id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to CV Details
                </Link>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit CV</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Manage the shared Profile Attribute values and Profile Projects used to generate this CV.
                </p>
            </div>

            {/* Informational Panel */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        This CV is generated dynamically. Changes to Profile Attribute values or Profile Projects are reflected in every CV that uses them.
                    </p>
                </div>
            </div>

            {/* CV Metadata Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Position</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-white">
                        {cv.position?.title || "No position assigned"}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</div>
                    <div className="mt-1 flex items-center gap-2">
                        {cv.status === "PUBLISHED" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                        ) : (
                            <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        )}
                        <span className="font-medium text-slate-900 dark:text-white">
                            {formatStatus(cv.status)}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Created</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-white">
                        {formatDate(cv.createdAt)}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Last Updated</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-white">
                        {formatDate(cv.updatedAt)}
                    </div>
                </div>
            </div>

            {/* Profile Identity Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Identity</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-slate-500 dark:text-slate-400">Full Name</span>
                        <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                            {cv.fullName || "Not provided"}
                        </p>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400">Email</span>
                        <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                            {cv.email || "Not provided"}
                        </p>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400">Location</span>
                        <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                            {cv.user?.location || "Not provided"}
                        </p>
                    </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                    Identity values come from the current Candidate Profile and cannot be changed for an individual CV.
                </p>
            </div>

            {/* Status and Publishing Information */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm">Status and Publishing</h4>
                    <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                        Status updates are managed from CV Details. Publishing requires all Position Attributes to be complete.
                    </p>
                </div>
            </div>

            {/* Position Attributes Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <ListChecks
                        className="h-5 w-5 text-slate-700 dark:text-slate-300"
                        aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Position Attributes
                    </h2>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    These are the Position-selected Profile values used to generate this CV. Editing a value updates the shared Profile master value.
                </p>

                {attributes.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        No position-specific Attributes are required.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th scope="col" className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                        Attribute
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                        Value
                                    </th>
                                    <th scope="col" className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                                        Profile Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {attributes.map((attribute) => (
                                    <tr key={attribute.positionAttributeId}>
                                        <td className="py-3 px-4 text-slate-900 dark:text-white">
                                            {attribute.name || "Unnamed Attribute"}
                                        </td>
                                        <td className="py-3 px-4">
                                            {formatAttributeValueForDisplay(attribute)}
                                        </td>
                                        <td className="py-3 px-4">
                                            {attribute.userAttributeId ? (
                                                <Link
                                                    to={`/profile/attributes/edit/${attribute.userAttributeId}?returnTo=${encodeURIComponent(`/cvs/edit/${id}`)}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors focus:outline-none focus:underline"
                                                >
                                                    Edit Profile Value
                                                </Link>
                                            ) : (
                                                <Link
                                                    to="/profile/attributes"
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors focus:outline-none focus:underline"
                                                >
                                                    Open Profile Attributes
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile Projects Panel */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mb-1">
                        <FolderKanban className="h-5 w-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Projects</h2>
                    </div>
                    <Info className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-1" aria-hidden="true" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    Matching Projects are loaded dynamically from your Profile using the Position's Technology Tags and configured Project limit.
                </p>
                <Link
                    to="/projects"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mt-3 transition-colors focus:outline-none focus:underline"
                >
                    Manage Profile Projects
                </Link>
            </div>

            {/* Return to CV Details */}
            <div className="flex justify-end">
                <Link
                    to={`/cvs/${id}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Return to CV Details
                </Link>
            </div>
        </div>
    );
};

export default EditCV;