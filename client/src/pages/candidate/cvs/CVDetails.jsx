// client/src/pages/candidate/cvs/CVDetails.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    FileText,
    BriefcaseBusiness,
    GraduationCap,
    Code,
    FolderKanban,
    CheckCircle2,
    Clock,
    Heart,
    AlertCircle,
    ListChecks,
    ExternalLink,
    RefreshCw,
    Upload,
    Info,
    Image as ImageIcon,
    CalendarDays,
    Tags,
} from "lucide-react";
import api from "../../../api/axios";

// --- Helpers ---

const getProjectDateOnlyValue = (value) => {
    if (!value) {
        return "";
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 10);
};

const formatProjectDateOnly = (value) => {
    const dateOnly = getProjectDateOnlyValue(value);

    if (!dateOnly) {
        return "N/A";
    }

    const [year, month, day] = dateOnly.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return "N/A";
    }

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    }).format(date);
};

const formatProjectPeriod = (project) => {
    const start = formatProjectDateOnly(project?.startDate);

    if (project?.isOngoing === true) {
        return start === "N/A" ? "Ongoing" : `${start} – Present`;
    }

    const end = formatProjectDateOnly(project?.endDate);

    if (start === "N/A" && end === "N/A") {
        return "Not specified";
    }

    if (start === "N/A") {
        return `Until ${end}`;
    }

    if (end === "N/A") {
        return `From ${start}`;
    }

    return `${start} – ${end}`;
};

const getProjectTags = (project) => {
    if (!Array.isArray(project?.projectTags)) {
        return [];
    }

    return project.projectTags
        .map((projectTag) => projectTag?.tag)
        .filter((tag) => tag && typeof tag.name === "string" && tag.name.trim());
};

const getSafeExternalUrl = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    try {
        const url = new URL(value.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
            return "";
        }

        return url.toString();
    } catch {
        return "";
    }
};

const CVDetails = () => {
    const { id } = useParams();

    const [cv, setCv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [publishing, setPublishing] = useState(false);
    const [publishError, setPublishError] = useState("");
    const [publishMissingAttributeIds, setPublishMissingAttributeIds] = useState([]);

    useEffect(() => {
        let cancelled = false;

        api.get(`/cvs/${id}`)
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;

                if (!data) {
                    setCv(null);
                    setError("CV not found.");
                    return;
                }

                setCv(data);
                setPublishError("");
                setPublishMissingAttributeIds([]);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setCv(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load CV details. Please try again."
                );
                console.error(
                    "Failed to load CV details:",
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
    }, [id, retryCounter]);

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

    const formatDateOnly = (value) => {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return String(value);
        }

        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        if (
            date.getUTCFullYear() !== year ||
            date.getUTCMonth() !== month - 1 ||
            date.getUTCDate() !== day
        ) {
            return value;
        }

        return date.toLocaleDateString("en-US", {
            timeZone: "UTC",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatStatus = (status) => {
        if (status === "PUBLISHED") return "Published";
        if (status === "DRAFT") return "Draft";
        return "Unknown";
    };

    const formatAttributeType = (type) => {
        if (!type) return "N/A";
        return type
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase());
    };

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

    const renderAttributeValue = (attribute) => {
        const value = attribute?.value;
        const type = attribute?.type;

        if (isAttributeMissing(attribute)) {
            return (
                <span className="inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Missing information
                </span>
            );
        }

        if (type === "BOOLEAN") {
            const isTrue = value === true || value === "true";
            return <span className="text-slate-900 dark:text-white">{isTrue ? "Yes" : "No"}</span>;
        }

        if (type === "DATE") {
            return <span className="text-slate-900 dark:text-white">{formatDateOnly(String(value))}</span>;
        }

        if (type === "IMAGE") {
            const safeUrl = getSafeExternalUrl(String(value));

            if (!safeUrl) {
                return (
                    <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        Invalid external image URL
                    </span>
                );
            }

            return (
                <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-400"
                >
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    Open external image
                </a>
            );
        }

        if (type === "TEXT") {
            return <span className="whitespace-pre-wrap break-words text-slate-900 dark:text-white">{String(value)}</span>;
        }

        return <span className="break-words text-slate-900 dark:text-white">{String(value)}</span>;
    };

    const handlePublish = async () => {
        if (!cv || publishing || cv.status !== "DRAFT") return;

        try {
            setPublishing(true);
            setPublishError("");
            setPublishMissingAttributeIds([]);

            const response = await api.patch(`/cvs/${id}`, {
                status: "PUBLISHED",
            });

            const updatedCV = response.data?.data;

            if (!updatedCV) {
                throw new Error("CV publish returned no data.");
            }

            setCv((currentCV) => ({
                ...currentCV,
                ...updatedCV,
                attributes: currentCV?.attributes || [],
                profileProjects: currentCV?.profileProjects || [],
            }));
        } catch (requestError) {
            setPublishError(
                requestError.response?.data?.message ||
                "Failed to publish CV. Please try again."
            );

            const missingIds = requestError.response?.data?.missingAttributeIds;
            setPublishMissingAttributeIds(
                Array.isArray(missingIds) ? missingIds : []
            );

            console.error(
                "Failed to publish CV:",
                requestError.message
            );
        } finally {
            setPublishing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading CV details...
                </div>
            </div>
        );
    }

    if (error && !cv) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/my-cvs"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to My CVs
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            CV Details
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View and manage your generated CV.
                        </p>
                    </div>
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
                                Error loading CV
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

    if (!cv) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/my-cvs"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to My CVs
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            CV Details
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View and manage your generated CV.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                        <FileText className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        CV not found
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        The requested CV does not exist.
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

    const attributes = Array.isArray(cv.attributes) ? cv.attributes : [];
    const profileProjects = Array.isArray(cv.profileProjects) ? cv.profileProjects : [];
    const missingAttributes = attributes.filter(isAttributeMissing);
    const missingAttributeCount = missingAttributes.length;

    const getFullName = () => {
        const firstName = cv.user?.firstName;
        const lastName = cv.user?.lastName;
        if (firstName || lastName) {
            return [firstName, lastName].filter(Boolean).join(" ");
        }
        return "Not provided";
    };

    const fullNameDisplay = cv.fullName || getFullName();
    const emailDisplay = cv.email || cv.user?.email || "Not provided";
    const locationDisplay = cv.user?.location || "Not provided";
    const likesCount = cv._count?.likes ?? 0;

    const skills = cv.skills
        ? [
            ...new Set(
                cv.skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
            ),
        ]
        : [];

    const getStatusIcon = (status) => {
        if (status === "PUBLISHED") {
            return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
        }
        return <Clock className="h-4 w-4" aria-hidden="true" />;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            CV Details
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View and manage the CV generated for{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                {cv.position?.title || "this position"}
                            </span>
                            .
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cv.status === "PUBLISHED"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}
                        >
                            {getStatusIcon(cv.status)}
                            {formatStatus(cv.status)}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Heart className="h-4 w-4" aria-hidden="true" />
                            {likesCount} like{likesCount !== 1 ? "s" : ""}
                        </span>
                        <Link
                            to="/my-cvs"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back
                        </Link>
                        <Link
                            to={`/cvs/edit/${id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                        >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit CV
                        </Link>
                        <Link
                            to={`/generated-cv/${id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-emerald-700 dark:hover:bg-emerald-600 dark:focus:ring-offset-slate-900"
                        >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            View Generated CV
                        </Link>
                        {cv.status === "DRAFT" && (
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={publishing}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {publishing ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" aria-hidden="true" />
                                        Publish CV
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Publish Error */}
            {publishError && (
                <div
                    className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 shadow-sm p-4"
                    role="alert"
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                {publishError}
                            </p>
                            {publishMissingAttributeIds.length > 0 && (
                                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                    Complete the highlighted Profile Attributes before publishing.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Published Info */}
            {cv.status === "PUBLISHED" && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm p-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                This CV is Published
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                It is visible to Recruiters while the Position remains available.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* CV Overview */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                    Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Full Name</span>
                        <span className="text-slate-900 dark:text-white font-medium">{fullNameDisplay}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Email</span>
                        <span className="text-slate-900 dark:text-white">{emailDisplay}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Phone</span>
                        <span className="text-slate-900 dark:text-white">{cv.phone || "Not provided"}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Location</span>
                        <span className="text-slate-900 dark:text-white">{locationDisplay}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Position</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                            {cv.position?.title || "Not specified"}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Company</span>
                        <span className="text-slate-900 dark:text-white">
                            {cv.position?.company || "Not specified"}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Department</span>
                        <span className="text-slate-900 dark:text-white">
                            {cv.position?.department || "Not specified"}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Position Status</span>
                        <span className="text-slate-900 dark:text-white">
                            {cv.position?.isActive === true
                                ? "Active"
                                : cv.position?.isActive === false
                                    ? "Inactive"
                                    : "Not specified"}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Created</span>
                        <span className="text-slate-900 dark:text-white">{formatDate(cv.createdAt)}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Last Updated</span>
                        <span className="text-slate-900 dark:text-white">{formatDate(cv.updatedAt)}</span>
                    </div>
                </div>
            </div>

            {/* Professional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Professional Summary
                        </h2>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                        {cv.summary || "No summary provided."}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                        <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Skills
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {skills.length > 0 ? (
                            skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <p className="text-slate-600 dark:text-slate-400">No skills provided.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                        <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Education
                        </h2>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                        {cv.education || "No education provided."}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                        <BriefcaseBusiness className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Experience
                        </h2>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                        {cv.experience || "No experience provided."}
                    </p>
                </div>
            </div>

            {/* Relational Projects Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                    <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Projects
                    </h2>
                </div>
                {profileProjects.length > 0 ? (
                    <div className="space-y-4">
                        {profileProjects.map((project) => {
                            const projectTags = getProjectTags(project);
                            const projectPeriod = formatProjectPeriod(project);

                            return (
                                <div
                                    key={project.id}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                to={`/projects/${project.id}`}
                                                className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                            >
                                                {project.title || "Untitled Project"}
                                            </Link>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                                <span>{projectPeriod}</span>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${project.isOngoing
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                }`}
                                        >
                                            {project.isOngoing ? "Ongoing" : "Completed"}
                                        </span>
                                    </div>

                                    {project.description?.trim() ? (
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-300">
                                            {project.description}
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">
                                            No description provided.
                                        </p>
                                    )}

                                    <div className="mb-2 mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        <Tags className="h-3.5 w-3.5" aria-hidden="true" />
                                        Technology Tags
                                    </div>
                                    {projectTags.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {projectTags.map((tag) => (
                                                <span
                                                    key={tag.id || `${project.id}-${tag.name}`}
                                                    className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm italic text-slate-500 dark:text-slate-400">
                                            No Technology Tags added.
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
                                        <span>Created {formatDate(project.createdAt)}</span>
                                        <span>Updated {formatDate(project.updatedAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 mt-2">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                    Candidate Profile Projects
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                    Projects are loaded dynamically from your Candidate Profile. Project periods and Technology Tags reflect your current Profile data.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                        No Profile Projects are currently available.
                    </p>
                )}
            </div>

            {/* Position Attributes */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Position Attributes
                        </h2>
                    </div>
                    {attributes.length > 0 &&
                        (missingAttributeCount === 0 ? (
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                All position attributes are complete.
                            </span>
                        ) : (
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                {missingAttributeCount} required attribute
                                {missingAttributeCount !== 1 ? "s are" : " is"} missing.
                            </span>
                        ))}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    These values are synchronized with your Candidate Profile.
                </p>
                {attributes.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-slate-600 dark:text-slate-400">
                            No position-specific attributes are required.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                    >
                                        Attribute
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                    >
                                        Category
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                    >
                                        Type
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                    >
                                        Value
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                    >
                                        Profile Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {attributes.map((attribute) => {
                                    const isMissing = isAttributeMissing(attribute);
                                    const isPublishMissing =
                                        publishMissingAttributeIds.includes(
                                            attribute.attributeId
                                        );
                                    return (
                                        <tr
                                            key={attribute.positionAttributeId}
                                            className={`${isMissing || isPublishMissing
                                                ? "bg-red-50 dark:bg-red-900/10"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                }`}
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                {attribute.name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                {attribute.category || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                {formatAttributeType(attribute.type)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderAttributeValue(attribute)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isMissing ? (
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        Missing
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Complete
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attribute.userAttributeId ? (
                                                    <Link
                                                        to={`/profile/attributes/edit/${attribute.userAttributeId}`}
                                                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                                    >
                                                        Edit Profile Value
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to="/profile/attributes"
                                                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                                    >
                                                        Open Profile Attributes
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Position Information */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                    Position Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="md:col-span-2">
                        <span className="text-slate-500 dark:text-slate-400 block">Title</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                            {cv.position?.title || "Not specified"}
                        </span>
                    </div>
                    <div className="md:col-span-2">
                        <span className="text-slate-500 dark:text-slate-400 block">Description</span>
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                            {cv.position?.description || "No description provided."}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Company</span>
                        <span className="text-slate-900 dark:text-white">
                            {cv.position?.company || "Not specified"}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Location</span>
                        <span className="text-slate-900 dark:text-white">
                            {cv.position?.location || "Not specified"}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Department</span>
                        <span className="text-slate-900 dark:text-white">
                            {cv.position?.department || "Not specified"}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Deadline</span>
                        <span className="text-slate-900 dark:text-white">
                            {formatDate(cv.position?.deadline)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVDetails;