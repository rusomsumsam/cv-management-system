import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    MapPin,
    Calendar,
    Tag,
    Clock,
    User,
    FileText,
    CalendarDays,
    Sparkles,
    RefreshCw,
    AlertCircle,
    Shield,
    Tags,
    Layers,
} from "lucide-react";
import api from "../../../api/axios";

const CandidatePositionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const fetchPosition = async () => {
            try {
                const response = await api.get(`/positions/${id}`);
                const data = response.data?.data;

                if (!cancelled) {
                    if (data && typeof data === "object") {
                        setPosition(data);
                        setError("");
                    } else {
                        setError("Position response is invalid.");
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Failed to load position details. Please try again."
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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const safeMaxProjects = (value) => {
        if (typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= 10) {
            return value;
        }
        return 4;
    };

    const extractTagNames = (position) => {
        if (
            !position ||
            typeof position !== "object" ||
            !Array.isArray(position.positionTags)
        ) {
            return [];
        }

        const names = [];
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
            names.push(name);
        }

        return names;
    };

    const getAccessTypePresentation = (accessType) => {
        if (accessType === "PUBLIC") {
            return {
                label: "Public",
                className:
                    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            };
        }

        if (accessType === "RESTRICTED") {
            return {
                label: "Restricted",
                className:
                    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            };
        }

        return {
            label: "N/A",
            className:
                "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        };
    };

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setPosition(null);
        setRetryCounter((previous) => previous + 1);
    };

    if (loading) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading position...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 max-w-md text-center" role="alert">
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
                    <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">Position not found</div>
                </div>
            </div>
        );
    }

    const creatorName = [position.user?.firstName, position.user?.lastName]
        .filter(
            (value) =>
                typeof value === "string" &&
                value.trim()
        )
        .map((value) => value.trim())
        .join(" ");

    const fullName = creatorName || "Unknown";

    const tagNames = extractTagNames(position);
    const maxProjects = safeMaxProjects(position.maxProjects);
    const accessType = getAccessTypePresentation(position.accessType);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 p-6 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Position Details</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Explore the complete job opportunity and generate a tailored CV.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/candidate/positions")}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back To Positions
                        </button>
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
                                <p className="text-xl font-semibold text-slate-900 dark:text-white">{position.title}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Building2 className="h-4 w-4" aria-hidden="true" />
                                    <span>Company</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">{position.company || "N/A"}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <MapPin className="h-4 w-4" aria-hidden="true" />
                                    <span>Location</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">{position.location || "N/A"}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Tag className="h-4 w-4" aria-hidden="true" />
                                    <span>Department</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">{position.department || "N/A"}</p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Calendar className="h-4 w-4" aria-hidden="true" />
                                    <span>Application Deadline</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">{formatDate(position.deadline)}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Clock className="h-4 w-4" aria-hidden="true" />
                                    <span>Status</span>
                                </div>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position.isActive
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                                        }`}
                                >
                                    {position.isActive ? "Active" : "Inactive"}
                                </span>
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
                                    <User className="h-4 w-4" aria-hidden="true" />
                                    <span>Posted By</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">{fullName}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                    <span>Posted Date</span>
                                </div>
                                <p className="text-base text-slate-900 dark:text-white">{formatDate(position.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Full Width: Technology Tags & Max Projects */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    <Tags className="h-4 w-4" aria-hidden="true" />
                                    <span>Technology Tags</span>
                                </div>
                                {tagNames.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No Technology Tags configured.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {tagNames.map((name, index) => (
                                            <span
                                                key={`tag-${index}`}
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
                                        <p className="text-sm text-slate-700 dark:text-slate-300">No Profile Projects will be selected until Technology Tags are configured for this Position.</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">Up to {maxProjects} matching Projects</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Your most recent Projects matching at least one Position Technology Tag may appear in the generated CV.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Full Width: Description */}
                    <div className="mt-2 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            <span>Description</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {position.description || "No description provided."}
                        </p>
                    </div>
                </div>

                {/* Action Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ready to apply?</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                Generate a professional CV tailored specifically for this position.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/cvs/generate/${id}`)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            Generate CV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidatePositionDetails;