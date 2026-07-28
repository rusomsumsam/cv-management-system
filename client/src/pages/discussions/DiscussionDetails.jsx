import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../api/axios";
import {
    ArrowLeft,
    Trash2,
    MessageSquare,
    User,
    Briefcase,
    Calendar,
    AlertCircle,
    Loader2
} from 'lucide-react';

const DiscussionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [discussion, setDiscussion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

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

    const getCreatorName = (user) => {
        if (!user) return "Unknown user";
        const firstName = user.firstName?.trim() || "";
        const lastName = user.lastName?.trim() || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ");
        return fullName || "Unknown user";
    };

    useEffect(() => {
        let cancelled = false;

        const fetchDiscussion = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/discussions/${id}`);
                if (cancelled) return;
                const data = response.data?.data;
                if (!data) {
                    setDiscussion(null);
                    setError("Discussion not found.");
                } else {
                    setDiscussion(data);
                    setError("");
                }
            } catch (err) {
                if (cancelled) return;
                setError(
                    err.response?.data?.message ||
                    "Failed to load discussion details. Please try again."
                );
                console.error("Error fetching discussion:", err.message);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchDiscussion();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleBack = () => {
        navigate("/discussions");
    };

    const handleDelete = async () => {
        if (!discussion || discussion.canDelete !== true || deleting) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this discussion?"
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            setDeleteError("");
            await api.delete(`/discussions/${id}`);
            navigate("/discussions");
        } catch (err) {
            setDeleteError(
                err.response?.data?.message ||
                "Failed to delete discussion. Please try again."
            );
            console.error("Error deleting discussion:", err.message);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" aria-hidden="true" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg">Loading discussion...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Discussion</h2>
                    <p className="text-slate-600 dark:text-slate-400" role="alert">{error}</p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-md text-center">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" aria-hidden="true" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Discussion Not Found</h2>
                    <p className="text-slate-600 dark:text-slate-400">The discussion you're looking for doesn't exist.</p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const creatorName = getCreatorName(discussion.user);
    const hasProfilePhoto = Boolean(discussion.user?.profilePhoto);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Discussion Details</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">View complete discussion information.</p>
                        </div>
                    </div>
                </div>

                {/* Discussion Information */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        Discussion Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Discussion Content</label>
                            <p className="text-slate-900 dark:text-white mt-1 leading-relaxed">
                                {discussion.content || "No content provided."}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Created Date</label>
                            <div className="flex items-center gap-2 mt-1 text-slate-900 dark:text-white">
                                <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                <span>{formatDate(discussion.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Discussion Creator */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        Discussion Creator
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="shrink-0">
                            {hasProfilePhoto ? (
                                <img
                                    src={discussion.user.profilePhoto}
                                    alt="Discussion creator"
                                    className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                                />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <User className="h-6 w-6" aria-hidden="true" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Creator</label>
                            <span className="text-slate-900 dark:text-white font-medium truncate">
                                {creatorName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Position Information */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        Position Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Position Title</label>
                            <div className="flex items-center gap-2 mt-1 text-slate-900 dark:text-white">
                                <Briefcase className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                <span className="font-medium">
                                    {discussion.position?.title || "N/A"}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Position Description</label>
                            <p className="text-slate-900 dark:text-white mt-1 leading-relaxed">
                                {discussion.position?.description || "No description provided."}
                            </p>
                        </div>
                        {discussion.position?.company && (
                            <div>
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Company</label>
                                <p className="text-slate-900 dark:text-white mt-1">
                                    {discussion.position.company}
                                </p>
                            </div>
                        )}
                        {discussion.position?.location && (
                            <div>
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Location</label>
                                <p className="text-slate-900 dark:text-white mt-1">
                                    {discussion.position.location}
                                </p>
                            </div>
                        )}
                        {discussion.position?.department && (
                            <div>
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Department</label>
                                <p className="text-slate-900 dark:text-white mt-1">
                                    {discussion.position.department}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Error Alert */}
                {deleteError && (
                    <div
                        className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3"
                        role="alert"
                    >
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                {deleteError}
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                        Back
                    </button>
                    {discussion.canDelete === true && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                                    Delete Discussion
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscussionDetails;