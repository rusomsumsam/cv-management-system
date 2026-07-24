import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { ArrowLeft, Edit2, FileText, AlertCircle, Heart } from "lucide-react";

const GeneratedCVView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cv, setCv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                setError(null);
            })
            .catch((requestError) => {
                if (cancelled) return;
                setCv(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load CV. Please try again."
                );
                console.error(
                    "Failed to fetch generated CV:",
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
    }, [id]);

    const handleBack = () => {
        navigate("/my-cvs");
    };

    const handleEdit = () => {
        navigate(`/cvs/edit/${id}`);
    };

    const formatAttributeType = (type) => {
        if (!type) return "N/A";
        return type
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
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

    const isEmpty = (value) => {
        if (value === null || value === undefined) return true;
        if (typeof value === "string") return value.trim() === "";
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === "object") return Object.keys(value).length === 0;
        return false;
    };

    const renderSection = (title, content, renderContent) => {
        const empty = isEmpty(content);
        return (
            <div
                className={`p-6 rounded-lg ${empty
                        ? "bg-red-50 border-2 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        : "bg-white border border-gray-200 dark:bg-slate-900 dark:border-slate-800"
                    }`}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    {empty && (
                        <div className="flex items-center text-red-600 dark:text-red-400 text-sm font-medium">
                            <AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                            Missing Information
                        </div>
                    )}
                </div>
                {empty ? (
                    <div className="text-red-700 dark:text-red-400 italic">
                        No information provided
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        );
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
                    <FileText
                        className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4"
                        aria-hidden="true"
                    />
                    <p className="text-gray-600 dark:text-slate-400 text-lg">
                        Loading CV...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-80 items-center justify-center">
                <div className="text-center max-w-md" role="alert">
                    <AlertCircle
                        className="w-12 h-12 text-red-600 mx-auto mb-4"
                        aria-hidden="true"
                    />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Error Loading CV
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400">{error}</p>
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
                    <FileText
                        className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4"
                        aria-hidden="true"
                    />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        CV not found
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400">
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

    const hasProfilePhoto = Boolean(cv.user?.profilePhoto);
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

    return (
        <div className="py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Generated CV
                            </h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1">
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
                                <Edit2 className="h-4 w-4" aria-hidden="true" />
                                Edit CV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resume Paper */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-8 md:p-12 space-y-8">
                    {/* Personal Information */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-gray-100 dark:border-slate-800 pb-2">
                            Personal Information
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="shrink-0">
                                {hasProfilePhoto ? (
                                    <img
                                        src={cv.user.profilePhoto}
                                        alt={fullNameDisplay}
                                        className="h-24 w-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                                    />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                        {getInitials()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Full Name
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {fullNameDisplay}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Email
                                    </label>
                                    <p className="text-gray-900 dark:text-white">{emailDisplay}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Phone
                                    </label>
                                    <p className="text-gray-900 dark:text-white">
                                        {cv.phone || "Not provided"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Location
                                    </label>
                                    <p className="text-gray-900 dark:text-white">
                                        {locationDisplay}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Summary */}
                    {renderSection(
                        "Professional Summary",
                        cv.summary,
                        () => (
                            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                                {cv.summary}
                            </p>
                        )
                    )}

                    {/* Skills */}
                    {renderSection(
                        "Skills",
                        cv.skills,
                        () => (
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
                        )
                    )}

                    {/* Education */}
                    {renderSection(
                        "Education",
                        cv.education,
                        () => (
                            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                                {cv.education}
                            </p>
                        )
                    )}

                    {/* Experience */}
                    {renderSection(
                        "Experience",
                        cv.experience,
                        () => (
                            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                                {cv.experience}
                            </p>
                        )
                    )}

                    {/* Projects */}
                    {renderSection(
                        "Projects",
                        cv.projects,
                        () => (
                            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                                {cv.projects}
                            </p>
                        )
                    )}

                    {/* Position Attributes */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Position Attributes
                            </h2>
                            {attributes.length > 0 ? (
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
                            ) : null}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Values are synchronized with your Candidate Profile.
                        </p>
                        {attributes.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
                                <p className="text-gray-600 dark:text-slate-400">
                                    No position-specific attributes are required.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                                                                    <AlertCircle
                                                                        className="h-4 w-4"
                                                                        aria-hidden="true"
                                                                    />
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

                    {/* Position Information */}
                    {cv.position && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
                                Position Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Position Title
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-semibold">
                                        {cv.position.title || "Not specified"}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Description
                                    </label>
                                    <p className="text-gray-700 dark:text-slate-300">
                                        {cv.position.description || "No description provided"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Company
                                    </label>
                                    <p className="text-gray-900 dark:text-white">
                                        {cv.position.company || "Not specified"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Location
                                    </label>
                                    <p className="text-gray-900 dark:text-white">
                                        {cv.position.location || "Not specified"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Department
                                    </label>
                                    <p className="text-gray-900 dark:text-white">
                                        {cv.position.department || "Not specified"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Deadline
                                    </label>
                                    <p className="text-gray-900 dark:text-white">
                                        {formatDate(cv.position.deadline)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                        Status
                                    </label>
                                    <p className="text-gray-900 dark:text-white">
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
        </div>
    );
};

export default GeneratedCVView;