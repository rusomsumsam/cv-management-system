// client/src/pages/candidate/cvs/GeneratedCVView.jsx
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../../api/axios";
import {
    ArrowLeft,
    FileText,
    AlertCircle,
    Heart,
    RefreshCw,
    CheckCircle2,
    Clock,
    FolderKanban,
    Image as ImageIcon,
    Info,
    CalendarDays,
    Tags,
} from "lucide-react";

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

const formatStatus = (status) => {
    if (status === "PUBLISHED") return "Published";
    if (status === "DRAFT") return "Draft";
    return "Unknown";
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

const formatAttributeType = (type) => {
    if (!type) return "N/A";
    return type
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
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
        return (
            <span className="whitespace-pre-wrap break-words text-slate-900 dark:text-white">
                {String(value)}
            </span>
        );
    }

    return <span className="break-words text-slate-900 dark:text-white">{String(value)}</span>;
};

const GeneratedCVView = () => {
    const { id } = useParams();
    const [cv, setCv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [imageError, setImageError] = useState(false);

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
                setImageError(false);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;
                setCv(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load CV. Please try again."
                );
                console.error("Failed to load generated CV:", requestError.message);
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
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Generated CV</h2>
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
                        The requested CV does not exist.
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

    const fullNameDisplay = cv.fullName || "Not provided";
    const emailDisplay = cv.email || cv.user?.email || "Not provided";
    const locationDisplay = cv.user?.location || "Not provided";
    const likesCount = cv._count?.likes ?? 0;
    const hasProfilePhoto = Boolean(cv.user?.profilePhoto) && !imageError;

    const getInitials = () => {
        const firstName = cv.user?.firstName;
        const lastName = cv.user?.lastName;
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }
        if (firstName) return firstName.charAt(0).toUpperCase();
        if (lastName) return lastName.charAt(0).toUpperCase();
        return "U";
    };

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

    const attributes = Array.isArray(cv.attributes) ? cv.attributes : [];
    const profileProjects = Array.isArray(cv.profileProjects) ? cv.profileProjects : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Generated CV</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Automatically generated CV for {cv.position?.title || "this position"}.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${cv.status === "PUBLISHED"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}
                        >
                            {formatStatus(cv.status)}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Heart className="h-4 w-4" aria-hidden="true" />
                            {likesCount} like{likesCount !== 1 ? "s" : ""}
                        </span>
                        <Link
                            to="/my-cvs"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back to My CVs
                        </Link>
                        <Link
                            to={`/cvs/${id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            CV Details
                        </Link>
                    </div>
                </div>
            </div>

            {/* Status Notes */}
            {cv.status === "DRAFT" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />
                    <div>
                        <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
                            This CV is a Draft and is not visible to Recruiters.
                        </p>
                    </div>
                </div>
            )}

            {cv.status === "PUBLISHED" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden="true" />
                    <div>
                        <p className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">
                            This CV is Published and visible to Recruiters while the Position remains available.
                        </p>
                    </div>
                </div>
            )}

            {/* Resume Paper */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-8 md:p-12 space-y-8 print:shadow-none print:border-0 print:p-0 print:bg-white print:text-black">
                {/* Personal Information */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                        Personal Information
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="shrink-0">
                            {hasProfilePhoto ? (
                                <img
                                    src={cv.user.profilePhoto}
                                    alt={`${fullNameDisplay} profile`}
                                    className="h-24 w-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                    {getInitials()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Full Name</span>
                                <p className="text-slate-900 dark:text-white font-medium">{fullNameDisplay}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Email</span>
                                <p className="text-slate-900 dark:text-white">{emailDisplay}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Phone</span>
                                <p className="text-slate-900 dark:text-white">{cv.phone || "Not provided"}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Location</span>
                                <p className="text-slate-900 dark:text-white">{locationDisplay}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Summary */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Professional Summary</h3>
                    {cv.summary ? (
                        <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 leading-relaxed">
                            {cv.summary}
                        </p>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic">Not provided</p>
                    )}
                </div>

                {/* Skills */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Skills</h3>
                    {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic">Not provided</p>
                    )}
                </div>

                {/* Education */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Education</h3>
                    {cv.education ? (
                        <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 leading-relaxed">
                            {cv.education}
                        </p>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic">Not provided</p>
                    )}
                </div>

                {/* Experience */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Work Experience</h3>
                    {cv.experience ? (
                        <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 leading-relaxed">
                            {cv.experience}
                        </p>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic">Not provided</p>
                    )}
                </div>

                {/* Position Attributes */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                        Position Attributes
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Values are synchronized with the Candidate Profile.
                    </p>
                    {attributes.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
                            <p className="text-slate-600 dark:text-slate-400">
                                No position-specific attributes are required.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Attribute
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Value
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {attributes.map((attribute) => {
                                            const missing = isAttributeMissing(attribute);
                                            return (
                                                <tr
                                                    key={attribute.positionAttributeId}
                                                    className={`${missing
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
                                                        {missing ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                Missing
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                Complete
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Projects */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                        <FolderKanban className="h-5 w-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Projects</h2>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <p>
                            Projects are loaded dynamically from the Candidate Profile. Project periods and Technology Tags reflect the Candidate’s current Profile data.
                        </p>
                    </div>
                    {profileProjects.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 italic">No Profile Projects are currently available.</p>
                    ) : (
                        <div className="space-y-4">
                            {profileProjects.map((project) => {
                                const projectTags = getProjectTags(project);
                                const projectPeriod = formatProjectPeriod(project);

                                return (
                                    <div
                                        key={project.id}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-slate-900 dark:text-white print:text-black">
                                                    {project.title || "Untitled Project"}
                                                </h4>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                                                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                                    <span>{projectPeriod}</span>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${project.isOngoing
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 print:bg-transparent print:text-black print:border print:border-slate-400"
                                                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 print:bg-transparent print:text-black print:border print:border-slate-400"
                                                    }`}
                                            >
                                                {project.isOngoing ? "Ongoing" : "Completed"}
                                            </span>
                                        </div>
                                        {project.description?.trim() ? (
                                            <p className="mt-2 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 print:text-black">
                                                {project.description}
                                            </p>
                                        ) : (
                                            <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400 print:text-slate-600">
                                                No description provided.
                                            </p>
                                        )}
                                        <div className="mb-2 mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                                            <Tags className="h-3.5 w-3.5" aria-hidden="true" />
                                            Technology Tags
                                        </div>
                                        {projectTags.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {projectTags.map((tag) => (
                                                    <span
                                                        key={tag.id || `${project.id}-${tag.name}`}
                                                        className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300 print:border-slate-400 print:bg-transparent print:text-black"
                                                    >
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm italic text-slate-500 dark:text-slate-400 print:text-slate-600">
                                                No Technology Tags added.
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 print:text-slate-600">
                                            Created: {formatDate(project.createdAt)} • Updated: {formatDate(project.updatedAt)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Position Information */}
                {cv.position && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
                            Position Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Position Title</span>
                                <p className="text-slate-900 dark:text-white font-semibold">
                                    {cv.position.title || "Not specified"}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Description</span>
                                <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
                                    {cv.position.description || "No description provided"}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Company</span>
                                <p className="text-slate-900 dark:text-white">
                                    {cv.position.company || "Not specified"}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Location</span>
                                <p className="text-slate-900 dark:text-white">
                                    {cv.position.location || "Not specified"}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Department</span>
                                <p className="text-slate-900 dark:text-white">
                                    {cv.position.department || "Not specified"}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Deadline</span>
                                <p className="text-slate-900 dark:text-white">
                                    {formatDate(cv.position.deadline)}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Status</span>
                                <p className="text-slate-900 dark:text-white">
                                    {cv.position.isActive === true
                                        ? "Active"
                                        : cv.position.isActive === false
                                            ? "Inactive"
                                            : "Not specified"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneratedCVView;