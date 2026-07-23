import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../api/axios";
import {
    Search,
    Plus,
    MessageSquare,
    Calendar,
    User,
    Briefcase,
    AlertCircle,
    Loader2
} from 'lucide-react';

const Discussions = () => {
    const navigate = useNavigate();
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchDiscussions = async () => {
            try {
                setLoading(true);
                const response = await api.get("/discussions");
                setDiscussions(response.data.data);
                setError("");
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load discussions. Please try again."
                );
                console.error("Error fetching discussions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDiscussions();
    }, []);

    const handleRowClick = (id) => {
        navigate(`/discussions/${id}`);
    };

    const handleCreateDiscussion = () => {
        navigate("/discussions/create");
    };

    const filteredDiscussions = discussions.filter((discussion) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const content = discussion.content?.toLowerCase() || "";
        const positionTitle = discussion.position?.title?.toLowerCase() || "";
        const fullName = `${discussion.user?.firstName || ""} ${discussion.user?.lastName || ""}`.toLowerCase();

        return (
            content.includes(searchLower) ||
            positionTitle.includes(searchLower) ||
            fullName.includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">Loading discussions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Discussions</h2>
                    <p className="text-slate-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Discussions</h1>
                            <p className="text-slate-600 mt-1">Browse and manage position discussions.</p>
                        </div>
                    </div>
                </div>

                {/* Top Toolbar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by content, position, or candidate..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleCreateDiscussion}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            Create Discussion
                        </button>
                    </div>
                </div>

                {/* Discussions Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {filteredDiscussions.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No discussions found</h3>
                            <p className="text-slate-600 mt-1">
                                {searchTerm
                                    ? "Try adjusting your search terms."
                                    : "Create your first discussion to get started."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Position
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Candidate
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Discussion
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Created Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredDiscussions.map((discussion) => (
                                        <tr
                                            key={discussion.id}
                                            onClick={() => handleRowClick(discussion.id)}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                    <span className="font-medium text-slate-900">
                                                        {discussion.position?.title || "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                    <span className="text-slate-900">
                                                        {discussion.user
                                                            ? `${discussion.user.firstName || ""} ${discussion.user.lastName || ""}`.trim() || "N/A"
                                                            : "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                                    <p className="text-slate-700 line-clamp-2">
                                                        {discussion.content || "No content"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                    <span className="text-slate-600">
                                                        {discussion.createdAt
                                                            ? new Date(discussion.createdAt).toLocaleDateString()
                                                            : "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Table Footer with Record Count */}
                {filteredDiscussions.length > 0 && (
                    <div className="mt-4 text-sm text-slate-600">
                        Showing {filteredDiscussions.length} discussion{filteredDiscussions.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Discussions;