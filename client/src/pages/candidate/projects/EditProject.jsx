import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    X,
    AlertCircle,
    RefreshCw,
    FolderKanban,
    Info,
} from "lucide-react";
import api from "../../../api/axios";

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [retryCounter, setRetryCounter] = useState(0);

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
                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                });
                setValidationErrors({});
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

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (validationErrors[name]) {
            setValidationErrors((previous) => ({
                ...previous,
                [name]: "",
            }));
        }

        if (error) {
            setError("");
        }
    };

    const validateForm = () => {
        const errors = {};

        if (typeof formData.title !== "string" || !formData.title.trim()) {
            errors.title = "Project title is required.";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
            };

            const response = await api.patch(`/projects/${id}`, payload);
            const updatedProject = response.data?.data;

            if (!updatedProject) {
                throw new Error("Project update returned no data.");
            }

            setProject(updatedProject);
            setFormData({
                title: updatedProject.title || "",
                description: updatedProject.description || "",
            });

            navigate(`/projects/${id}`);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Failed to update project. Please try again."
            );
            console.error(
                "Failed to update Project:",
                requestError.message
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (saving) return;
        navigate(`/projects/${id}`);
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
                <div className="flex items-center gap-4">
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Projects
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Edit Project
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Update the reusable Project information used across your generated CVs.
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
                <div className="flex items-center gap-4">
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Projects
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Edit Project
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Update the reusable Project information used across your generated CVs.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                        <FolderKanban className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        Project not found
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        We couldn't find this project.
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

    const createdDate = formatDate(project.createdAt);
    const updatedDate = formatDate(project.updatedAt);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Link
                    to={`/projects/${id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded dark:focus:ring-offset-slate-900"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Project Details
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Edit Project
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Update the reusable Project information used across your generated CVs.
                    </p>
                </div>
            </div>

            {/* Project Metadata */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Created: {createdDate}</span>
                    <span>Last updated: {updatedDate}</span>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                {/* API Error */}
                {error && (
                    <div
                        className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3"
                        role="alert"
                    >
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Example: E-Commerce Platform"
                            aria-invalid={Boolean(validationErrors.title)}
                            aria-describedby={
                                validationErrors.title ? "title-error" : undefined
                            }
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {validationErrors.title && (
                            <p
                                id="title-error"
                                className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                            >
                                {validationErrors.title}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                            Description <span className="text-slate-400 dark:text-slate-500 text-xs font-normal ml-1">(Optional)</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={7}
                            value={formData.description}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Describe the Project, your role, and the technologies used..."
                            className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                        />
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            Markdown source text is supported. Rich rendering will be added in the Project details phase.
                        </p>
                    </div>

                    {/* Info Note */}
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
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

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={saving}
                            className="flex-1 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" aria-hidden="true" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProject;