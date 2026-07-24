import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FileText,
    Calendar,
    CheckCircle2,
    Clock,
    Heart,
    Pencil,
    Trash2,
    AlertCircle,
    RefreshCw
} from "lucide-react";
import api from "../../../api/axios";

const CandidateCVs = () => {
    const navigate = useNavigate();

    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCVId, setSelectedCVId] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [retryCounter, setRetryCounter] = useState(0);

    useEffect(() => {
        let cancelled = false;

        api.get("/cvs")
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;
                setCvs(Array.isArray(data) ? data : []);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setCvs([]);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load your CVs. Please try again."
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

    const handleSelectCV = (cvId) => {
        setSelectedCVId((currentId) => (currentId === cvId ? "" : cvId));
        setDeleteError("");
    };

    const selectedCV = cvs.find((cv) => cv.id === selectedCVId) || null;

    const handleEditSelected = () => {
        if (!selectedCV) return;
        navigate(`/cvs/edit/${selectedCV.id}`);
    };

    const handleOpenDeleteDialog = () => {
        if (!selectedCV) return;
        setDeleteError("");
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteSelected = async () => {
        if (!selectedCV || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");

            await api.delete(`/cvs/${selectedCV.id}`);

            setCvs((currentCVs) =>
                currentCVs.filter((cv) => cv.id !== selectedCV.id)
            );
            setSelectedCVId("");
            setIsDeleteDialogOpen(false);
        } catch (requestError) {
            setDeleteError(
                requestError.response?.data?.message ||
                "Failed to delete CV. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        if (deleting) return;
        setDeleteError("");
        setIsDeleteDialogOpen(false);
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

    const getStatusColor = (status) => {
        if (status === "PUBLISHED") {
            return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
        }
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    };

    const getStatusIcon = (status) => {
        return status === "PUBLISHED" ? CheckCircle2 : Clock;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-80">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading your CVs...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800/30 dark:bg-red-900/10"
                role="alert"
            >
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error loading CVs</h3>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-800/30 dark:text-red-300 dark:hover:bg-red-800/50"
                        >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (cvs.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                <FileText className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-white">No CVs found</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Generate your first CV from an available position.
                </p>
                <Link
                    to="/candidate/positions"
                    className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                    Browse Available Positions
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My CVs</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage your generated CVs and track their status.
                    </p>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {cvs.length === 1 ? "1 CV" : `${cvs.length} CVs`}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedCV ? (
                        <span>
                            Selected:{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                {selectedCV.position?.title || "CV"}
                            </span>
                        </span>
                    ) : (
                        "Select a CV to manage it."
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleEditSelected}
                        disabled={!selectedCV}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenDeleteDialog}
                        disabled={!selectedCV}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
                    >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                    </button>
                </div>
            </div>

            {/* CVs Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 w-12">
                                    <span className="sr-only">Select</span>
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Full Name
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Position
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Status
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Created
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Updated
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Likes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {cvs.map((cv) => {
                                const StatusIcon = getStatusIcon(cv.status);
                                const isSelected = selectedCVId === cv.id;
                                const likesCount = cv._count?.likes ?? 0;

                                return (
                                    <tr
                                        key={cv.id}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected
                                                ? "bg-blue-50 dark:bg-blue-900/10"
                                                : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select CV for ${cv.position?.title || "position"}`}
                                                checked={isSelected}
                                                onChange={() => handleSelectCV(cv.id)}
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                                                    <FileText className="h-4 w-4" aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <Link
                                                        to={`/cvs/${cv.id}`}
                                                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                                    >
                                                        {cv.fullName || "Unnamed CV"}
                                                    </Link>
                                                    {cv.email && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                            {cv.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                            {cv.position?.title || "N/A"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                    cv.status
                                                )}`}
                                            >
                                                <StatusIcon className="h-3 w-3" aria-hidden="true" />
                                                {formatStatus(cv.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                {formatDate(cv.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                            {formatDate(cv.updatedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
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
            </div>

            {/* Delete Confirmation Dialog */}
            {isDeleteDialogOpen && selectedCV && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-cv-dialog-title"
                >
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <h2 id="delete-cv-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                            Delete CV?
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            This will permanently delete your CV for{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                "{selectedCV.position?.title || "this position"}"
                            </span>
                            . This action cannot be undone.
                        </p>

                        {deleteError && (
                            <div className="mt-3 rounded-md bg-red-50 p-3 dark:bg-red-900/20" role="alert">
                                <p className="text-sm text-red-700 dark:text-red-400">{deleteError}</p>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deleting}
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                disabled={deleting}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
                            >
                                {deleting && (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                )}
                                Delete CV
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateCVs;