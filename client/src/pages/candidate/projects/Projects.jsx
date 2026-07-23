import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    FolderKanban,
    Calendar
} from "lucide-react";
import api from "../../../api/axios";

const Projects = () => {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get("/projects");
                setProjects(response.data.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load projects. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const filteredProjects = projects.filter((project) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            project.title?.toLowerCase().includes(searchLower) ||
            project.description?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="bg-slate-50 p-6 min-h-screen flex items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">Loading projects...</div>
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

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
                            <p className="text-slate-600 mt-1">Manage projects used in CV generation.</p>
                        </div>
                        <button
                            onClick={() => navigate("/projects/create")}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create Project
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                    </div>
                </div>

                {/* Projects Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Created Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FolderKanban className="h-12 w-12 text-slate-300 mb-3" />
                                                <div className="text-slate-500 text-sm font-medium">
                                                    No projects found
                                                </div>
                                                <p className="text-slate-400 text-xs mt-1">
                                                    Create a new project to showcase your work.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <tr
                                            key={project.id}
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                                                        <FolderKanban className="h-4 w-4" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {project.title || "N/A"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-600 truncate max-w-xs">
                                                {project.description || "N/A"}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {formatDate(project.createdAt)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Projects;