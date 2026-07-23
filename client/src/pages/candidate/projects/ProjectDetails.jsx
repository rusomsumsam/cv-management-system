import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, FolderKanban, Calendar, Clock } from "lucide-react";
import api from "../../../api/axios";

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await api.get(`/projects/${id}`);
                setProject(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load project details. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this project?"
        );
        if (!confirmed) return;

        try {
            await api.delete(`/projects/${id}`);
            navigate("/projects");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete project. Please try again."
            );
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading project...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <div className="text-red-600 text-sm font-medium mb-2">Error</div>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <div className="text-slate-600 text-sm font-medium">Project not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Page Header / Toolbar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Project Details</h1>
                            <p className="text-slate-600 mt-1">View detailed information about your project.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/projects")}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                            <button
                                onClick={() => navigate(`/projects/edit/${id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit Project
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Project
                            </button>
                        </div>
                    </div>
                </div>

                {/* Project Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <FolderKanban className="h-4 w-4" />
                                    <span>Title</span>
                                </div>
                                <p className="text-xl font-semibold text-slate-900">{project.title || "N/A"}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Created Date</span>
                                </div>
                                <p className="text-base text-slate-900">{formatDate(project.createdAt)}</p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Last Updated</span>
                                </div>
                                <p className="text-base text-slate-900">{formatDate(project.updatedAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Full Width: Description */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <span>Description</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {project.description || "No description provided."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;