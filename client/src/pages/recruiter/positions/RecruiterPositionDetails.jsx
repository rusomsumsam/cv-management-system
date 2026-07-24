import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    AlertCircle,
    RefreshCw,
    Search,
    Heart,
    CheckCircle2,
    ExternalLink,
    Users,
    X,
    ListChecks
} from "lucide-react";
import api from "../../../api/axios";

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

const getCandidateName = (cv) => {
    const profileName = [cv.user?.firstName, cv.user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    return profileName || cv.fullName || "Unnamed Candidate";
};

const getPositionOwnerName = (position) => {
    const name = [position?.user?.firstName, position?.user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    return name || "Unknown";
};

const RecruiterPositionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [position, setPosition] = useState(null);
    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCounter, setRetryCounter] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCVId, setSelectedCVId] = useState("");
    const [likeUpdating, setLikeUpdating] = useState(false);
    const [likeError, setLikeError] = useState("");
    const [likeMessage, setLikeMessage] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api.get(`/positions/${id}`),
            api.get("/cvs"),
        ])
            .then(([positionResponse, cvsResponse]) => {
                if (cancelled) return;

                const positionData = positionResponse.data?.data;
                if (!positionData) {
                    setPosition(null);
                    setCvs([]);
                    setError("Position not found.");
                    return;
                }

                const cvData = cvsResponse.data?.data;
                const positionCVs = Array.isArray(cvData)
                    ? cvData.filter(
                        (cv) =>
                            cv.status === "PUBLISHED" &&
                            cv.position?.isActive === true &&
                            (cv.positionId === id || cv.position?.id === id)
                    )
                    : [];

                setPosition(positionData);
                setCvs(positionCVs);
                setSelectedCVId("");
                setSearchTerm("");
                setError("");
                setLikeError("");
                setLikeMessage("");
                setDeleteError("");
            })
            .catch((requestError) => {
                if (cancelled) return;

                setPosition(null);
                setCvs([]);
                setSelectedCVId("");
                setError(
                    requestError.response?.data?.message ||
                    "Failed to load Position details. Please try again."
                );
                console.error("Failed to load Recruiter Position details:", requestError.message);
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
        setLikeError("");
        setLikeMessage("");
        setDeleteError("");
        setRetryCounter((prev) => prev + 1);
    };

    const handleSelectCV = (cvId) => {
        setSelectedCVId((currentId) => (currentId === cvId ? "" : cvId));
        setLikeError("");
        setLikeMessage("");
    };

    const selectedCV = cvs.find((cv) => cv.id === selectedCVId) || null;

    const handleViewSelected = () => {
        if (!selectedCV) return;
        navigate(`/recruiter/cvs/${selectedCV.id}`);
    };

    const handleLikeToggle = async () => {
        if (!selectedCV || likeUpdating || selectedCV.status !== "PUBLISHED" || selectedCV.position?.isActive !== true) {
            return;
        }

        try {
            setLikeUpdating(true);
            setLikeError("");
            setLikeMessage("");

            const response = selectedCV.likedByCurrentUser
                ? await api.delete(`/likes/cvs/${selectedCV.id}`)
                : await api.post(`/likes/cvs/${selectedCV.id}`);

            const data = response.data?.data;

            if (
                !data ||
                data.cvId !== selectedCV.id ||
                typeof data.likedByCurrentUser !== "boolean" ||
                typeof data.likesCount !== "number"
            ) {
                throw new Error("Like update returned invalid data.");
            }

            setCvs((currentCVs) =>
                currentCVs.map((cv) => {
                    if (cv.id !== data.cvId) {
                        return cv;
                    }
                    return {
                        ...cv,
                        likedByCurrentUser: data.likedByCurrentUser,
                        _count: {
                            ...cv._count,
                            likes: Math.max(0, data.likesCount),
                        },
                    };
                })
            );

            setLikeMessage(
                response.data?.message ||
                (data.likedByCurrentUser
                    ? "CV liked successfully."
                    : "CV unliked successfully.")
            );
        } catch (requestError) {
            setLikeError(
                requestError.response?.data?.message ||
                "Failed to update CV Like. Please try again."
            );
            console.error("Failed to update Position CV Like:", requestError.message);
        } finally {
            setLikeUpdating(false);
        }
    };

    const openDeleteDialog = () => {
        if (deleting) return;
        setDeleteError("");
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        if (deleting) return;
        setDeleteDialogOpen(false);
    };

    const handleDelete = async () => {
        if (!position || deleting) return;

        try {
            setDeleting(true);
            setDeleteError("");
            await api.delete(`/positions/${id}`);
            navigate("/positions");
        } catch (requestError) {
            setDeleteError(
                requestError.response?.data?.message ||
                "Failed to delete Position. Please try again."
            );
            console.error("Failed to delete Position:", requestError.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setSelectedCVId("");
        setLikeError("");
        setLikeMessage("");
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setSelectedCVId("");
        setLikeError("");
        setLikeMessage("");
    };

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredCVs = cvs.filter((cv) => {
        if (!normalizedSearchTerm) return true;
        return (
            getCandidateName(cv).toLowerCase().includes(normalizedSearchTerm) ||
            cv.fullName?.toLowerCase().includes(normalizedSearchTerm) ||
            cv.email?.toLowerCase().includes(normalizedSearchTerm)
        );
    });

    if (loading) {
        return (
            <div className="min-h-[320px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span className="text-sm font-medium">Loading Position details...</span>
                </div>
            </div>
        );
    }

    if (error && !position) {
        return (
            <div className="space-y-6" role="alert">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Link
                        to="/positions"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Positions
                    </Link>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Position Details</h2>
                            <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{error}</p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                            >
                                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!position) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Link
                        to="/positions"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to Positions
                    </Link>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Position not found</h2>
                    <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">The requested Position does not exist.</p>
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const ownerName = getPositionOwnerName(position);

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Dialog */}
            {deleteDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 id="delete-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">Delete Position</h2>
                            <button
                                type="button"
                                onClick={closeDeleteDialog}
                                disabled={deleting}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 rounded"
                                aria-label="Close dialog"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Are you sure you want to delete the position <span className="font-medium text-slate-900 dark:text-white">"{position.title}"</span>? This action cannot be undone.
                        </p>
                        {deleteError && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2" role="alert">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                                <span>{deleteError}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeDeleteDialog}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                            >
                                {deleting ? (
                                    <span className="inline-flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                                        Deleting...
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2">
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                        Delete Position
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Position Details</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">View Position information and review its Published Candidate CVs.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            to="/positions"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back
                        </Link>
                        <Link
                            to={`/positions/edit/${id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                        >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit Position
                        </Link>
                        <Link
                            to={`/positions/${id}/attributes`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                        >
                            <ListChecks className="h-4 w-4" aria-hidden="true" />
                            Manage Attributes
                        </Link>
                        <button
                            type="button"
                            onClick={openDeleteDialog}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Delete Position
                        </button>
                    </div>
                </div>
            </div>

            {/* Position Details Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Position Title</span>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">{position.title}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Company</span>
                            <p className="text-base text-slate-900 dark:text-white">{position.company || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Location</span>
                            <p className="text-base text-slate-900 dark:text-white">{position.location || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Department</span>
                            <p className="text-base text-slate-900 dark:text-white">{position.department || "N/A"}</p>
                        </div>
                    </div>
                    {/* Right Column */}
                    <div className="space-y-5">
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Deadline</span>
                            <p className="text-base text-slate-900 dark:text-white">{formatDate(position.deadline)}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Status</span>
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position.isActive
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                                    }`}
                            >
                                {position.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Posted By</span>
                            <p className="text-base text-slate-900 dark:text-white">{ownerName}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">Created Date</span>
                            <p className="text-base text-slate-900 dark:text-white">{formatDate(position.createdAt)}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block">
                                Last Updated
                            </span>
                            <p className="text-base text-slate-900 dark:text-white">
                                {formatDate(position.updatedAt)}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Full Width: Description */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-2">Description</span>
                    <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 leading-relaxed">
                        {position.description || "No description provided."}
                    </p>
                </div>
            </div>

            {/* Published CVs Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Published CVs for this Position</h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Review Published Candidate CVs associated with this Position.</p>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {cvs.length} CV{cvs.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {cvs.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-12 text-center">
                        <Users className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Published CVs for this Position</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-400">
                            Published Candidate CVs associated with this Position will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* CV Search */}
                        {cvs.length > 0 && (
                            <div className="relative max-w-md mb-4">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    aria-label="Search Position Published CVs"
                                    placeholder="Search by Candidate name or email..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {/* CV Toolbar */}
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 mb-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    {selectedCV ? (
                                        <span>
                                            Selected: <span className="font-medium text-slate-900 dark:text-white">
                                                {getCandidateName(selectedCV)}
                                            </span>
                                        </span>
                                    ) : (
                                        <span>Select a CV to view or manage its Like.</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 ml-auto">
                                    <button
                                        type="button"
                                        onClick={handleLikeToggle}
                                        disabled={!selectedCV || likeUpdating}
                                        aria-pressed={Boolean(selectedCV?.likedByCurrentUser)}
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${selectedCV?.likedByCurrentUser
                                                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 focus:ring-red-500"
                                                : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 focus:ring-blue-500"
                                            } ${(!selectedCV || likeUpdating) ? "opacity-70 cursor-not-allowed" : ""}`}
                                    >
                                        {likeUpdating ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Heart
                                                    className="h-4 w-4"
                                                    fill={selectedCV?.likedByCurrentUser ? "currentColor" : "none"}
                                                    aria-hidden="true"
                                                />
                                                {selectedCV?.likedByCurrentUser ? "Unlike CV" : "Like CV"}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleViewSelected}
                                        disabled={!selectedCV || likeUpdating}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                                    >
                                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                        View CV
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Like Feedback */}
                        {likeError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-3 mb-4 flex items-start gap-2" role="alert">
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                                <p className="text-red-700 dark:text-red-400 text-sm">{likeError}</p>
                            </div>
                        )}
                        {likeMessage && !likeError && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-3 mb-4 flex items-start gap-2" role="status">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                                <p className="text-emerald-700 dark:text-emerald-400 text-sm">{likeMessage}</p>
                            </div>
                        )}

                        {/* CV Table */}
                        {filteredCVs.length === 0 && cvs.length > 0 ? (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
                                <Search className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" aria-hidden="true" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No matching CVs found</h3>
                                <p className="mt-1 text-slate-600 dark:text-slate-400">Try a different Candidate name or email.</p>
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="mt-4 inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                                >
                                    Clear Search
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                                <th scope="col" className="px-4 py-3 w-10 text-left">
                                                    <span className="sr-only">Select</span>
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                                    Candidate
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                                    Email
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                                    Likes
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                                                    Updated
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {filteredCVs.map((cv) => {
                                                const candidateName = getCandidateName(cv);
                                                return (
                                                    <tr
                                                        key={cv.id}
                                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedCVId === cv.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                                            }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCVId === cv.id}
                                                                onChange={() => handleSelectCV(cv.id)}
                                                                aria-label={`Select CV for ${candidateName}`}
                                                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 dark:focus:ring-blue-500"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Link
                                                                to={`/recruiter/cvs/${cv.id}`}
                                                                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:underline"
                                                            >
                                                                {candidateName}
                                                            </Link>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                            {cv.email || "N/A"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                                                Published
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                                <Heart
                                                                    className={cv.likedByCurrentUser ? "h-4 w-4 text-red-600 dark:text-red-400" : "h-4 w-4"}
                                                                    fill={cv.likedByCurrentUser ? "currentColor" : "none"}
                                                                    aria-hidden="true"
                                                                />
                                                                {cv._count?.likes ?? 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                            {formatDate(cv.updatedAt)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RecruiterPositionDetails;