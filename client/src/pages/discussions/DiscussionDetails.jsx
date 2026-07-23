import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../api/axios";
import {
    ArrowLeft,
    Trash2,
    MessageSquare,
    User,
    Mail,
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

    useEffect(() => {
        const fetchDiscussion = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/discussions/${id}`);
                setDiscussion(response.data.data);
                setError("");
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load discussion details. Please try again."
                );
                console.error("Error fetching discussion:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDiscussion();
    }, [id]);

    const handleBack = () => {
        navigate("/discussions");
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this discussion?"
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            await api.delete(`/discussions/${id}`);
            navigate("/discussions");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete discussion. Please try again."
            );
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">Loading discussion...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Discussion</h2>
                    <p className="text-slate-600">{error}</p>
                    <button
                        onClick={handleBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md text-center">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Discussion Not Found</h2>
                    <p className="text-slate-600">The discussion you're looking for doesn't exist.</p>
                    <button
                        onClick={handleBack}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Discussion Details</h1>
                            <p className="text-slate-600 mt-1">View complete discussion information.</p>
                        </div>
                    </div>
                </div>

                {/* Discussion Information */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        Discussion Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-500">Discussion Content</label>
                            <p className="text-slate-900 mt-1 leading-relaxed">
                                {discussion.content || "No content provided."}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Created Date</label>
                            <div className="flex items-center gap-2 mt-1 text-slate-900">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span>
                                    {discussion.createdAt
                                        ? new Date(discussion.createdAt).toLocaleDateString()
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Candidate Information */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Candidate Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-500">Full Name</label>
                            <div className="flex items-center gap-2 mt-1 text-slate-900">
                                <User className="h-4 w-4 text-slate-400" />
                                <span>
                                    {discussion.user
                                        ? `${discussion.user.firstName || ""} ${discussion.user.lastName || ""}`.trim() || "N/A"
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Email</label>
                            <div className="flex items-center gap-2 mt-1 text-slate-900">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <span>{discussion.user?.email || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Position Information */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        Position Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-500">Position Title</label>
                            <div className="flex items-center gap-2 mt-1 text-slate-900">
                                <Briefcase className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">
                                    {discussion.position?.title || "N/A"}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-500">Position Description</label>
                            <p className="text-slate-900 mt-1 leading-relaxed">
                                {discussion.position?.description || "No description provided."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleBack}
                        className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-5 h-5" />
                                Delete Discussion
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscussionDetails;