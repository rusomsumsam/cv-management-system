import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    FileText,
    Briefcase,
    GraduationCap,
    Code,
    FolderKanban,
    CheckCircle2,
    Clock,
    Heart,
    AlertCircle,
    ListChecks,
    ExternalLink,
} from "lucide-react";
import api from "../../../api/axios";

const CVDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cv, setCv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                console.error("Failed to fetch CV details:", requestError.message);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleBack = () => {
        navigate("/my-cvs");
    };

    const handleEdit = () => {
        navigate(`/cvs/edit/${id}`);
    };

    const handleViewGeneratedCV = () => {
        navigate(`/generated-cv/${id}`);
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

    const formatStatus = (status) => {
        if (!status) return "Draft";
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const formatAttributeType = (type) => {
        if (!type) return "N/A";
        return type
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const isAttributeMissing = (attribute) => {
        if (typeof attribute.isMissing === "boolean") {
            return attribute.isMissing;
        }
        return typeof attribute.value !== "string" || attribute.value.trim() === "";
    };

    if (loading) {
        return (
            <div className="flex min-h-80 items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                        Loading CV details...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-80 items-center justify-center">
                <div className="text-center max-w-md" role="alert">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Error Loading CV
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">{error}</p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!cv) {
        return (
            <div className="flex min-h-80 items-center justify-center">
                <div className="text-center max-w-md">
                    <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        CV not found
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        The requested CV does not exist.
                    </p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

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

    const attributes = Array.isArray(cv.attributes) ? cv.attributes : [];
    const missingAttributeCount = attributes.filter(isAttributeMissing).length;

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
                            View and manage your CV for {cv.position?.title || "this position"}.
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
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit CV
                        </button>
                        <button
                            type="button"
                            onClick={handleViewGeneratedCV}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            View Generated CV
                        </button>
                    </div>
                </div>
            </div>

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
                        <span className="text-slate-900 dark:text-white font-medium">{cv.position?.title || "Not specified"}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Company</span>
                        <span className="text-slate-900 dark:text-white">{cv.position?.company || "Not specified"}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Department</span>
                        <span className="text-slate-900 dark:text-white">{cv.position?.department || "Not specified"}</span>
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
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
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
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {cv.education || "No education provided."}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                        <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Experience
                        </h2>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {cv.experience || "No experience provided."}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                    <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Projects
                    </h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {cv.projects || "No projects provided."}
                </p>
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
                    {attributes.length > 0 && (
                        missingAttributeCount === 0 ? (
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                All position attributes are complete.
                            </span>
                        ) : (
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                {missingAttributeCount} required attribute
                                {missingAttributeCount !== 1 ? "s are" : " is"} missing.
                            </span>
                        )
                    )}
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
                                    const isMissing = isAttributeMissing(attribute);
                                    return (
                                        <tr
                                            key={attribute.positionAttributeId}
                                            className={`${isMissing
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
                                                {isMissing ? (
                                                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                                        Missing information
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-900 dark:text-white">
                                                        {attribute.value ?? "N/A"}
                                                    </span>
                                                )}
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
                        <span className="text-slate-900 dark:text-white font-medium">{cv.position?.title || "Not specified"}</span>
                    </div>
                    <div className="md:col-span-2">
                        <span className="text-slate-500 dark:text-slate-400 block">Description</span>
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {cv.position?.description || "No description provided."}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Company</span>
                        <span className="text-slate-900 dark:text-white">{cv.position?.company || "Not specified"}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Location</span>
                        <span className="text-slate-900 dark:text-white">{cv.position?.location || "Not specified"}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Department</span>
                        <span className="text-slate-900 dark:text-white">{cv.position?.department || "Not specified"}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Deadline</span>
                        <span className="text-slate-900 dark:text-white">{formatDate(cv.position?.deadline)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVDetails;