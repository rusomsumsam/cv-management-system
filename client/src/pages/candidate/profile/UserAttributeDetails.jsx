import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Tag,
    Folder,
    FileCode,
    CalendarDays,
    Clock,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Image as ImageIcon,
    Info,
} from "lucide-react";
import api from "../../../api/axios";

const UserAttributeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [userAttribute, setUserAttribute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        api.get(`/user-attributes/${id}`)
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;

                if (!data) {
                    setUserAttribute(null);
                    setError("User attribute not found.");
                    return;
                }

                setUserAttribute(data);
                setImageError(false);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setUserAttribute(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load attribute details. Please try again."
                );
                console.error(
                    "Failed to load User Attribute details:",
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
            month: "long",
            day: "numeric",
        });
    };

    const formatDateOnly = (value) => {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value || "N/A";
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
            month: "long",
            day: "numeric",
        });
    };

    const formatAttributeType = (type) => {
        if (!type) return "N/A";
        return type
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase());
    };

    const getTypeBadgeClasses = (type) => {
        const baseClasses =
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

        switch (type) {
            case "STRING":
                return `${baseClasses} bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`;
            case "TEXT":
                return `${baseClasses} bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400`;
            case "NUMERIC":
                return `${baseClasses} bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`;
            case "BOOLEAN":
                return `${baseClasses} bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
            case "DATE":
                return `${baseClasses} bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`;
            case "PERIOD":
                return `${baseClasses} bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`;
            case "DROPDOWN":
                return `${baseClasses} bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400`;
            case "IMAGE":
                return `${baseClasses} bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400`;
            default:
                return `${baseClasses} bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400`;
        }
    };

    const isMissingValue = (value) => {
        return (
            value === null ||
            value === undefined ||
            (typeof value === "string" && value.trim() === "")
        );
    };

    const renderAttributeValue = () => {
        const type = userAttribute?.attribute?.type;
        const value = userAttribute?.value;

        if (isMissingValue(value)) {
            return (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            Missing information
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                            This attribute value has not been set.
                        </p>
                    </div>
                </div>
            );
        }

        switch (type) {
            case "BOOLEAN": {
                const isTrue = value === true || value === "true";
                return (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isTrue
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                        >
                            {isTrue ? "Yes" : "No"}
                        </span>
                    </span>
                );
            }

            case "DATE": {
                return <span className="text-base text-slate-900 dark:text-white">{formatDateOnly(value)}</span>;
            }

            case "IMAGE": {
                return (
                    <div className="space-y-3">
                        <div className="flex items-start gap-4 flex-wrap">
                            {!imageError ? (
                                <img
                                    src={value}
                                    alt={`${userAttribute.attribute?.name || "Attribute"} preview`}
                                    className="h-24 w-24 flex-shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                    <ImageIcon className="h-8 w-8 text-slate-400" aria-hidden="true" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-600 dark:text-slate-400 break-all">
                                    {value}
                                </p>
                                <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                                >
                                    Open external image
                                </a>
                            </div>
                        </div>
                    </div>
                );
            }

            case "TEXT": {
                return (
                    <div className="whitespace-pre-wrap break-words text-base text-slate-900 dark:text-white rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                        {value || "N/A"}
                    </div>
                );
            }

            case "PERIOD": {
                return (
                    <div className="space-y-2">
                        <p className="text-base text-slate-900 dark:text-white break-words">
                            {value || "N/A"}
                        </p>
                        <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Structured Period rendering will be available after the Period schema migration.
                            </p>
                        </div>
                    </div>
                );
            }

            case "DROPDOWN": {
                return (
                    <div className="space-y-2">
                        <p className="text-base text-slate-900 dark:text-white break-words">
                            {value || "N/A"}
                        </p>
                        <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Dropdown options will be available after the Attribute Option schema migration.
                            </p>
                        </div>
                    </div>
                );
            }

            default: {
                return (
                    <p className="text-base text-slate-900 dark:text-white break-words">
                        {value || "N/A"}
                    </p>
                );
            }
        }
    };

    const handleOpenDeleteDialog = () => {
        setDeleteError("");
        setIsDeleteDialogOpen(true);
    };

    const handleCancelDelete = () => {
        if (deleting) return;
        setDeleteError("");
        setIsDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!userAttribute || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");

            await api.delete(`/user-attributes/${id}`);
            navigate("/profile/attributes");
        } catch (requestError) {
            setDeleteError(
                requestError.response?.data?.message ||
                "Failed to remove attribute. Please try again."
            );
            console.error(
                "Failed to delete User Attribute:",
                requestError.message
            );
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading attribute details...
                </div>
            </div>
        );
    }

    if (error && !userAttribute) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile/attributes"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Attributes
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
                                Error loading attribute
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

    if (!userAttribute) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile/attributes"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Attributes
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                        <Info className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        User attribute not found
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        We couldn't find this attribute value.
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

    const formattedType = formatAttributeType(userAttribute.attribute?.type);

    return (
        <div className="space-y-6">
            {/* Page Header / Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Attribute Details
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View detailed information about your profile attribute value.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link
                            to="/profile/attributes"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back
                        </Link>
                        <Link
                            to={`/profile/attributes/edit/${id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                        >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={handleOpenDeleteDialog}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-slate-900"
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Attribute Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <Tag className="h-4 w-4" aria-hidden="true" />
                                <span>Attribute Name</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                {userAttribute.attribute?.name || "N/A"}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <Folder className="h-4 w-4" aria-hidden="true" />
                                <span>Category</span>
                            </div>
                            <p className="text-base text-slate-900 dark:text-white">
                                {userAttribute.attribute?.category || "N/A"}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                <span>Value</span>
                            </div>
                            {renderAttributeValue()}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <FileCode className="h-4 w-4" aria-hidden="true" />
                                <span>Type</span>
                            </div>
                            <div className="pt-1">
                                <span className={getTypeBadgeClasses(userAttribute.attribute?.type)}>
                                    {formattedType}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                <span>Created Date</span>
                            </div>
                            <p className="text-base text-slate-900 dark:text-white">
                                {formatDate(userAttribute.createdAt)}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <Clock className="h-4 w-4" aria-hidden="true" />
                                <span>Last Updated</span>
                            </div>
                            <p className="text-base text-slate-900 dark:text-white">
                                {formatDate(userAttribute.updatedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {isDeleteDialogOpen && userAttribute && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-user-attribute-dialog-title"
                >
                    <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                        <h2
                            id="delete-user-attribute-dialog-title"
                            className="text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            Remove Profile Attribute?
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            This removes{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                “{userAttribute.attribute?.name || "Attribute"}”
                            </span>{" "}
                            from your Profile. CVs that require this Attribute may show it as missing until it is added again.
                        </p>

                        {deleteError && (
                            <div
                                className="mt-3 rounded-md bg-red-50 dark:bg-red-900/20 p-3"
                                role="alert"
                            >
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    {deleteError}
                                </p>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deleting}
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-slate-900"
                            >
                                {deleting && (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                )}
                                Delete Attribute
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAttributeDetails;