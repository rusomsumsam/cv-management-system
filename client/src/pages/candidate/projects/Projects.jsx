import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    FolderKanban,
    CalendarDays,
    Clock,
    Pencil,
    Trash2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import api from "../../../api/axios";

const Projects = () => {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        api.get("/projects")
            .then((response) => {
                if (cancelled) return;

                const data = response.data?.data;
                setProjects(Array.isArray(data) ? data : []);
                setSelectedProjectId("");
                setError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setProjects([]);
                setSelectedProjectId("");
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load projects. Please try again."
                );
                console.error(
                    "Failed to load Projects:",
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
    }, [retryCounter]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((previous) => previous + 1);
    };

    const handleSelectProject = (projectId) => {
        setSelectedProjectId((currentId) =>
            currentId === projectId ? "" : projectId
        );
        setDeleteError("");
    };

    const selectedProject =
        projects.find((project) => project.id === selectedProjectId) || null;

    const handleEditSelected = () => {
        if (!selectedProject) return;
        navigate(`/projects/edit/${selectedProject.id}`);
    };

    const handleOpenDeleteDialog = () => {
        if (!selectedProject) return;
        setDeleteError("");
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteSelected = async () => {
        if (!selectedProject || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");

            await api.delete(`/projects/${selectedProject.id}`);

            setProjects((currentProjects) =>
                currentProjects.filter(
                    (project) => project.id !== selectedProject.id
                )
            );
            setSelectedProjectId("");
            setIsDeleteDialogOpen(false);
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

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredProjects = projects.filter((project) => {
        if (!normalizedSearchTerm) return true;

        return (
            project.title?.toLowerCase().includes(normalizedSearchTerm) ||
            project.description?.toLowerCase().includes(normalizedSearchTerm)
        );
    });

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading projects...
                </div>
            </div>
        );
    }

    if (error && projects.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            My Projects
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Manage Projects used across your generated CVs.
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
                                Error loading projects
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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        My Projects
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage Projects used across your generated CVs.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {projects.length === 1
                            ? "1 project"
                            : `${projects.length} projects`}
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate("/projects/create")}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Create Project
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        aria-label="Search projects"
                        placeholder="Search by title or description..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedProject ? (
                        <span>
                            Selected:{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                {selectedProject.title || "Untitled Project"}
                            </span>
                        </span>
                    ) : (
                        "Select a project to manage it."
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleEditSelected}
                        disabled={!selectedProject}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenDeleteDialog}
                        disabled={!selectedProject}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-slate-900"
                    >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Projects Table */}
            {projects.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <FolderKanban className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
                        No projects added yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Create a Project to showcase your work in generated CVs.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/projects/create")}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Create Project
                    </button>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        No matching projects found
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Try a different search term.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 w-12">
                                        <span className="sr-only">Select</span>
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Project
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Description
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Created
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredProjects.map((project) => {
                                    const isSelected = selectedProjectId === project.id;

                                    return (
                                        <tr
                                            key={project.id}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected
                                                    ? "bg-blue-50 dark:bg-blue-900/10"
                                                    : ""
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select project ${project.title || "Untitled Project"}`}
                                                    checked={isSelected}
                                                    onChange={() => handleSelectProject(project.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                                                        <FolderKanban className="h-4 w-4" aria-hidden="true" />
                                                    </div>
                                                    <Link
                                                        to={`/projects/${project.id}`}
                                                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded dark:text-blue-400 dark:focus:ring-offset-slate-900"
                                                    >
                                                        {project.title || "Untitled Project"}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 max-w-md truncate">
                                                {project.description || "No description provided."}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                    {formatDate(project.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                                    {formatDate(project.updatedAt)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {isDeleteDialogOpen && selectedProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-project-dialog-title"
                >
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <h2 id="delete-project-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                            Delete Project?
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            This permanently deletes{" "}
                            <span className="font-medium text-slate-900 dark:text-white">
                                “{selectedProject.title || "Untitled Project"}”
                            </span>{" "}
                            from your Profile. This action cannot be undone.
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
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
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

export default Projects;