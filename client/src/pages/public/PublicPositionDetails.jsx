import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    MapPin,
    Calendar,
    Tag,
    Clock,
    FileText,
    Shield,
    Tags,
    Layers,
    RefreshCw,
    AlertCircle,
    CalendarDays,
} from "lucide-react";
import api from "../../api/axios";

// --- Helpers ---

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

const safeMaxProjects = (value) => {
    if (typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= 10) {
        return value;
    }
    return 4;
};

const safeCvsCount = (position) => {
    const count = position._count?.cvs;
    if (typeof count === "number" && Number.isSafeInteger(count) && count >= 0) {
        return count;
    }
    return 0;
};

const extractTagNames = (position) => {
    if (
        !position ||
        typeof position !== "object" ||
        !Array.isArray(position.positionTags)
    ) {
        return [];
    }

    const tags = [];
    const seen = new Set();

    for (const positionTag of position.positionTags) {
        const rawName = positionTag?.tag?.name;

        if (typeof rawName !== "string") {
            continue;
        }

        const name = rawName.trim();

        if (!name) {
            continue;
        }

        const normalizedName = name.toLowerCase();

        if (seen.has(normalizedName)) {
            continue;
        }

        seen.add(normalizedName);
        tags.push(name);
    }

    return tags;
};

const getAccessTypePresentation = (accessType) => {
    if (accessType === "PUBLIC") {
        return {
            label: "Public",
            className:
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        };
    }

    return {
        label: "N/A",
        className:
            "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    };
};

// --- Component ---

const PublicPositionDetails = () => {
    const { id } = useParams();
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchPosition = async () => {
            try {
                setNotFound(false);
                setError("");

                const response = await api.get(`/positions/public/${id}`);
                const data = response.data?.data;

                if (!cancelled) {
                    if (data && typeof data === "object") {
                        setPosition(data);
                        setNotFound(false);
                        setError("");
                    } else {
                        setPosition(null);
                        setNotFound(false);
                        setError("Position response is invalid.");
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setPosition(null);

                    if (err.response?.status === 404) {
                        setNotFound(true);
                        setError("");
                        return;
                    }

                    setNotFound(false);
                    setError(
                        err.response?.data?.message ||
                        "Failed to load Position details. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchPosition();

        return () => {
            cancelled = true;
        };
    }, [id, retryCounter]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setNotFound(false);
        setPosition(null);
        setRetryCounter((prev) => prev + 1);
    };

    if (loading) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-medium">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading Position details...
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 max-w-md text-center">
                    <Briefcase className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Position not found
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        This public Position does not exist or is no longer available.
                    </p>
                    <Link
                        to="/public/positions"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Positions
                    </Link>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 min-h-screen flex items-center justify-center">
                <div
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 max-w-md text-center"
                    role="alert"
                >
                    <div className="flex flex-col items-center">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mb-3" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Error</h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{error}</p>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!position) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 max-w-md text-center">
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                        Position not found
                    </div>
                </div>
            </div>
        );
    }

    const tagNames = extractTagNames(position);
    const maxProjects = safeMaxProjects(position.maxProjects);
    const cvsCount = safeCvsCount(position);
    const accessType = getAccessTypePresentation(position.accessType);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 p-6 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Position Details
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Read-only public Position information.
                            </p>
                        </div>
                        <Link
                            to="/public/positions"
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back to Positions
                        </Link>
                    </div>
                </div>

                {/* Position Details Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                                    <span>Position Title</span>
                                </div>
                                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {position.title}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Building2 className="h-4 w-4" aria-hidden="true" />
                                    <span>Company</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">
                                    {position.company || "N/A"}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <MapPin className="h-4 w-4" aria-hidden="true" />
                                    <span>Location</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">
                                    {position.location || "N/A"}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Tag className="h-4 w-4" aria-hidden="true" />
                                    <span>Department</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">
                                    {position.department || "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Calendar className="h-4 w-4" aria-hidden="true" />
                                    <span>Deadline</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">
                                    {formatDate(position.deadline)}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Clock className="h-4 w-4" aria-hidden="true" />
                                    <span>Last Updated</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">
                                    {formatDate(position.updatedAt)}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Shield className="h-4 w-4" aria-hidden="true" />
                                    <span>Access Type</span>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${accessType.className}`}
                                >
                                    {accessType.label}
                                </span>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <FileText className="h-4 w-4" aria-hidden="true" />
                                    <span>Submitted CVs</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">
                                    {cvsCount}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                    <span>Created Date</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">
                                    {formatDate(position.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technology Tags & Max Projects */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                <Tags className="h-4 w-4" aria-hidden="true" />
                                <span>Technology Tags</span>
                            </div>
                            {tagNames.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No Technology Tags configured.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {tagNames.map((name) => (
                                        <span
                                            key={`tag-${name.toLowerCase()}`}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        >
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                <Layers className="h-4 w-4" aria-hidden="true" />
                                <span>Maximum Projects</span>
                            </div>
                            {tagNames.length === 0 ? (
                                <>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        No Profile Projects can be matched until Technology Tags are configured for this Position.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        Up to {maxProjects} matching Projects
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        When a Candidate generates a CV, only recent Profile Projects matching at least one Position Technology Tag are included, up to this configured limit.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        <span>Description</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {position.description || "No description provided."}
                    </p>
                </div>

                {/* Call to Action */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Interested in this Position?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                Sign in as a Candidate to check your eligibility and generate a tailored CV.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                to="/login"
                                className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicPositionDetails;