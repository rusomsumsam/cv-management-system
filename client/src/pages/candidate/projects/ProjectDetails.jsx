import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    FolderKanban,
    CalendarDays,
    Clock,
    AlertCircle,
    RefreshCw,
    Info,
} from "lucide-react";
import api from "../../../api/axios";

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        api.get(`/projects/${id}`)
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;

                if (!data) {
                    setProject(null);
                    setError("Project not found.");
                    return;
                }

                setProject(data);
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setProject(null);
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load project details. Please try again."
                );
                console.error(
                    "Failed to load Project details:",
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
        if (!project || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");

            await api.delete(`/projects/${id}`);
            navigate("/projects");
        } catch (requestError) {
            setDeleteError(
                requestError.response?.data?.message ||
                "Failed to delete project. Please try again."
            );
            console.error(
                "Failed to delete Project:",
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
                    Loading project...
                </div>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Project Details
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View the reusable Project information used across your generated CVs.
                        </p>
                    </div>
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Projects
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
                                Error loading project
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

    if (!project) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Project Details
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            View the reusable Project information used across your generated CVs.
                        </p>
                    </div>
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Projects
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                        <FolderKanban className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        Project not found
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        We couldn't find this Project.
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

    const hasDescription =
        typeof project.description === "string" &&
        project.description.trim().length > 0;

    const createdDate = formatDate(project.createdAt);
    const updatedDate = formatDate(project.updatedAt);

    return (
        <div className="space-y-6">
            {/* Page Header / Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Project Details
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        View the reusable Project information used across your generated CVs.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back
                    </Link>
                    <Link
                        to={`/projects/edit/${id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit Project
                    </Link>
                    <button
                        type="button"
                        onClick={handleOpenDeleteDialog}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-slate-900"
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete Project
                    </button>
                </div>
            </div>

            {/* Project Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <FolderKanban className="h-4 w-4" aria-hidden="true" />
                                <span>Title</span>
                            </div>
                            <p className="text-xl font-semibold text-slate-900 dark:text-white">
                                {project.title || "Untitled Project"}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                <span>Created Date</span>
                            </div>
                            <p className="text-base text-slate-900 dark:text-white">
                                {createdDate}
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <Clock className="h-4 w-4" aria-hidden="true" />
                                <span>Last Updated</span>
                            </div>
                            <p className="text-base text-slate-900 dark:text-white">
                                {updatedDate}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Full Width: Description */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span>Description</span>
                    </div>
                    {hasDescription ? (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                            {project.description}
                        </p>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                            No description provided.
                        </p>
                    )}
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Markdown support
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Markdown is currently displayed as source text. Rich Markdown rendering will be added in a later Project phase.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Current Schema Note */}
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Current Project fields
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                            Period and Technology Tags will be added after the Project schema migration.
                        </p>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {isDeleteDialogOpen && project && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-project-dialog-title"
                >
                    <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                        <h2
                            id="delete-project-dialog-title"
                            className="text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            Delete Project?
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            This permanently deletes{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                “{project.title || "Untitled Project"}”
                            </span>{" "}
                            from your Profile. This action cannot be undone.
                        </p>

                        {deleteError && (
                            <div className="mt-3 rounded-md bg-red-50 dark:bg-red-900/20 p-3" role="alert">
                                <p className="text-sm text-red-700 dark:text-red-400">{deleteError}</p>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deleting}
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
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
                                Delete Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;