import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from "../../hooks/useAuth";
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

const normalizeSearchValue = (value) => {
    return typeof value === "string"
        ? value.trim().toLowerCase()
        : "";
};

const getCreatorName = (creator) => {
    const firstName =
        typeof creator?.firstName === "string"
            ? creator.firstName.trim()
            : "";

    const lastName =
        typeof creator?.lastName === "string"
            ? creator.lastName.trim()
            : "";

    return [firstName, lastName].filter(Boolean).join(" ") || "Unknown user";
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

const Discussions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);

    const role =
        typeof user?.role === "string"
            ? user.role.trim().toUpperCase()
            : "";

    useEffect(() => {
        let cancelled = false;

        const fetchDiscussions = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get("/discussions");
                if (cancelled) return;
                const data = response.data?.data;
                setDiscussions(Array.isArray(data) ? data : []);
                setError("");
            } catch (err) {
                if (cancelled) return;
                setError(
                    err.response?.data?.message ||
                    "Failed to load discussions. Please try again."
                );
                console.error("Error fetching discussions:", err.message);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchDiscussions();

        return () => {
            cancelled = true;
        };
    }, [retryCounter]);

    const handleRowClick = (id) => {
        navigate(`/discussions/${id}`);
    };

    const handleCreateDiscussion = () => {
        navigate("/discussions/create");
    };

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRetryCounter((prev) => prev + 1);
    };

    const handleRowKeyDown = (e, id) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleRowClick(id);
        }
    };

    const normalizedSearchTerm = normalizeSearchValue(searchTerm);

    const filteredDiscussions = discussions
        .filter((discussion) => {
            // Require a valid Discussion ID before rendering
            const discussionId =
                typeof discussion?.id === "string"
                    ? discussion.id.trim()
                    : "";
            if (!discussionId) return false;

            if (!normalizedSearchTerm) return true;

            const content = normalizeSearchValue(discussion.content);
            const positionTitle = normalizeSearchValue(discussion.position?.title);
            const company = normalizeSearchValue(discussion.position?.company);
            const location = normalizeSearchValue(discussion.position?.location);
            const department = normalizeSearchValue(discussion.position?.department);
            const creatorName = normalizeSearchValue(getCreatorName(discussion.user));

            return (
                content.includes(normalizedSearchTerm) ||
                positionTitle.includes(normalizedSearchTerm) ||
                creatorName.includes(normalizedSearchTerm) ||
                company.includes(normalizedSearchTerm) ||
                location.includes(normalizedSearchTerm) ||
                department.includes(normalizedSearchTerm)
            );
        });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" aria-hidden="true" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg">Loading discussions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Discussions</h2>
                    <p className="text-slate-600 dark:text-slate-400" role="alert">{error}</p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Discussions</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">Browse and manage position discussions.</p>
                        </div>
                    </div>
                </div>

                {/* Top Toolbar */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            <input
                                type="text"
                                placeholder="Search by content, position, or candidate..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search discussions"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                        {role === "CANDIDATE" && (
                            <button
                                type="button"
                                onClick={handleCreateDiscussion}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Create Discussion
                            </button>
                        )}
                    </div>
                </div>

                {/* Discussions Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {filteredDiscussions.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                {searchTerm.trim() ? "No discussions match your search." : "No discussions are available."}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                {searchTerm.trim()
                                    ? "Try adjusting your search terms."
                                    : role === "CANDIDATE"
                                        ? "Create your first discussion to get started."
                                        : "No discussions have been created yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Position
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Candidate
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Discussion
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Created Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredDiscussions.map((discussion) => {
                                        const discussionId =
                                            typeof discussion?.id === "string"
                                                ? discussion.id.trim()
                                                : "";
                                        const creatorName = getCreatorName(discussion.user);
                                        const hasProfilePhoto = Boolean(discussion.user?.profilePhoto);
                                        const positionTitle =
                                            typeof discussion.position?.title === "string"
                                                ? discussion.position.title.trim() || "N/A"
                                                : "N/A";
                                        const content =
                                            typeof discussion.content === "string"
                                                ? discussion.content.trim() || "No content"
                                                : "No content";

                                        return (
                                            <tr
                                                key={discussionId}
                                                onClick={() => handleRowClick(discussionId)}
                                                onKeyDown={(e) => handleRowKeyDown(e, discussionId)}
                                                tabIndex={0}
                                                role="link"
                                                aria-label={`Discussion for ${positionTitle} by ${creatorName}`}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
                                                        <span className="font-medium text-slate-900 dark:text-white">
                                                            {positionTitle}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {hasProfilePhoto ? (
                                                            <img
                                                                src={discussion.user.profilePhoto}
                                                                alt="Discussion creator"
                                                                className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                            />
                                                        ) : (
                                                            <User className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
                                                        )}
                                                        <span className="text-slate-900 dark:text-white">
                                                            {creatorName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-md">
                                                    <div className="flex items-start gap-2">
                                                        <MessageSquare className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                                        <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                                                            {content}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
                                                        <span className="text-slate-600 dark:text-slate-400">
                                                            {formatDate(discussion.createdAt)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Table Footer with Record Count */}
                {filteredDiscussions.length > 0 && (
                    <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                        Showing {filteredDiscussions.length} discussion{filteredDiscussions.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Discussions;